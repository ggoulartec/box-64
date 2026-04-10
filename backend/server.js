require('dotenv').config(); // 🛡️ Carrega as senhas do arquivo .env
const express = require("express");
const http = require("http");
const {Server} = require('socket.io');
const cors = require('cors');
const {createClient} = require('@supabase/supabase-js');

// 🔌 Conexão real com o Banco de Dados
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ Estado em Memória (Agora funciona como um Cache ultrarrápido)
const leiloesAtivosCache = {};

// 📦 ROTA: Criar Novo Leilão
app.post('/api/leiloes', async (req, res) => {
    const dados = req.body;

    try {
        // 1. Salva a miniatura primeiro
        const {data: miniatura, error: erroMiniatura} = await supabase
            .from('miniaturas')
            .insert([{
                vendedor_id: dados.vendedor_id,
                titulo: dados.titulo,
                descricao: dados.descricao,
                fotos: dados.fotos,
                estado: dados.estado,
                ano_lancamento: dados.ano,
                serie: dados.serie,
                is_th: dados.is_th,
                is_sth: dados.is_sth
            }])
            .select().single();

        if (erroMiniatura) throw erroMiniatura;

        // 2. Cria o Leilão amarrado à miniatura
        const {data: leilao, error: erroLeilao} = await supabase
            .from('leiloes')
            .insert([{
                miniatura_id: miniatura.id,
                vendedor_id: dados.vendedor_id,
                preco_inicial: dados.preco_inicial,
                lance_atual: dados.preco_inicial,
                data_inicio: dados.data_inicio,
                data_fim: dados.data_fim,
                is_anonimo: dados.is_anonimo,
                status: 'ativo'
            }])
            .select().single();

        if (erroLeilao) throw erroLeilao;

        // 3. Coloca no Cache para o WebSocket rodar liso
        leiloesAtivosCache[leilao.id] = {
            lanceAtual: leilao.lance_atual,
            dataFim: new Date(leilao.data_fim).getTime()
        };

        res.status(201).json({mensagem: 'Leilão salvo no Supabase!', leilao});
    } catch (error) {
        console.error("Erro banco:", error);
        res.status(500).json({erro: 'Falha ao salvar no banco.'});
    }
});

// 📦 ROTA: Listar Vitrine (Home)
app.get('/api/leiloes', async (req, res) => {
    const {aba} = req.query; // Recebe 'ativos', 'recentes' ou 'arquivo'
    const agora = new Date().toISOString();
    const ha24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const ha30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
        let query = supabase.from('leiloes').select(`
            *, 
            miniaturas(*),
            perfis!vencedor_id (apelido)
        `);

        if (aba === 'arquivo') {
            query = query
                .eq('status', 'finalizado')
                .lt('data_fim', ha24Horas)
                .gt('data_fim', ha30Dias);
        } else if (aba === 'recentes') {
            query = query
                .eq('status', 'finalizado')
                .gt('data_fim', ha24Horas);
        } else {
            query = query.eq('status', 'ativo').gt('data_fim', agora);
        }

        const {data, error} = await query.order('data_fim', {ascending: false});
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({erro: error.message});
    }
});

// 📦 ROTA: Buscar 1 Leilão (Sala Dinâmica)
app.get('/api/leiloes/:id', async (req, res) => {
    try {
        const {data, error} = await supabase
            .from('leiloes')
            .select('id, preco_inicial, lance_atual, data_fim, status, miniaturas(titulo, fotos, serie, is_th, is_sth)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({erro: 'Leilão não encontrado.'});
    }
});

app.get('/api/leiloes/:id/lances', async (req, res) => {
    const {id} = req.params;

    try {
        const {data, error} = await supabase
            .from('lances')
            .select(`
                valor,
                criado_at,
                perfis ( apelido )
            `)
            .eq('leilao_id', id)
            .order('valor', {ascending: false});

        if (error) throw error;

        const historicoFormatado = data.map(lance => ({
            usuario: lance.perfis.apelido,
            valor: lance.valor,
            hora: new Date(lance.criado_at).toLocaleTimeString()
        }));

        res.json(historicoFormatado);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        res.status(500).json({erro: "Falha ao buscar lances."});
    }
});

const server = http.createServer(app);
const io = new Server(server, {cors: {origin: "*", methods: ["GET", "POST"]}});

const tabelaIncrementos = [
    {piso: 500000, incremento: 10000}, {piso: 100000, incremento: 2000}, {piso: 50000, incremento: 1000},
    {piso: 20000, incremento: 500}, {piso: 5000, incremento: 300}, {piso: 2000, incremento: 200},
    {piso: 1000, incremento: 100}, {piso: 500, incremento: 50}, {piso: 100, incremento: 30}, {piso: 0, incremento: 10}
];

function calcularProximoLanceMinimo(lanceAtual) {
    const faixa = tabelaIncrementos.find(t => lanceAtual >= t.piso) || tabelaIncrementos[tabelaIncrementos.length - 1];
    return lanceAtual + faixa.incremento;
}

// 🎧 WebSocket (A Mágica do Tempo Real)
io.on('connection', (socket) => {
    socket.on('entrar_sala_leilao', async (leilaoId) => {
        socket.join(leilaoId);

        // Se o servidor reiniciou e não tem o cronômetro no cache, ele busca no Supabase!
        if (!leiloesAtivosCache[leilaoId]) {
            const {data} = await supabase.from('leiloes').select('lance_atual, data_fim').eq('id', leilaoId).single();
            if (data) {
                leiloesAtivosCache[leilaoId] = {
                    lanceAtual: data.lance_atual,
                    dataFim: new Date(data.data_fim).getTime()
                };
            }
        }

        if (leiloesAtivosCache[leilaoId]) {
            socket.emit('estado_inicial', leiloesAtivosCache[leilaoId]);
        }
    });

    socket.on('enviar_lance', async (dados) => {
        try {
            const {error: erroLance} = await supabase
                .from('lances')
                .insert([{
                    leilao_id: dados.leilaoId,
                    usuario_id: dados.usuarioId,
                    valor: dados.valor
                }]);

            if (erroLance) throw erroLance;

            const novoDataFim = new Date(Date.now() + 5 * 60000).toISOString();

            const {error: erroUpdate} = await supabase
                .from('leiloes')
                .update({
                    lance_atual: dados.valor,
                    data_fim: novoDataFim
                })
                .eq('id', dados.leilaoId);

            if (erroUpdate) throw erroUpdate;

            io.to(dados.leilaoId).emit('novo_lance_aceito', {
                valor: dados.valor,
                usuario: dados.apelido,
                novoDataFim: Date.parse(novoDataFim)
            });

        } catch (error) {
            console.error("Erro ao salvar lance:", error);
            socket.emit('erro_lance', {msg: "Falha ao processar seu lance no banco de dados."});
        }
    });

    socket.on('encerrar_leilao', async (leilaoId) => {
        try {
            const {data: maiorLance, error: erroBusca} = await supabase
                .from('lances')
                .select('usuario_id, valor, perfis(apelido)')
                .eq('leilao_id', leilaoId)
                .order('valor', {ascending: false})
                .limit(1)
                .maybeSingle();

            if (erroBusca) throw erroBusca;

            const vencedorId = maiorLance ? maiorLance.usuario_id : null;
            const vencedorNome = maiorLance ? maiorLance.perfis.apelido : 'Sem Vencedor';
            const valorFinal = maiorLance ? maiorLance.valor : 0;

            const {error: erroUpdate} = await supabase
                .from('leiloes')
                .update({
                    status: 'finalizado',
                    vencedor_id: vencedorId
                })
                .eq('id', leilaoId);

            if (erroUpdate) throw erroUpdate;

            io.to(leilaoId).emit('leilao_finalizado', {
                vencedor: vencedorNome,
                vencedorId: vencedorId,
                valorFinal: valorFinal
            });

            console.log(`✅ Leilão ${leilaoId} encerrado. Vencedor: ${vencedorNome}`);
        } catch (error) {
            console.error("❌ Falha crítica no encerramento:", error);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} conectado ao Supabase 🚀`));