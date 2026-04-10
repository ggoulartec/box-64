require('dotenv').config(); // 🛡️ Carrega as senhas do arquivo .env
const express = require("express");
const http = require("http");
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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
        const { data: miniatura, error: erroMiniatura } = await supabase
            .from('miniaturas')
            .insert([{
                vendedor_id: "02abba15-1fb0-4330-b1ad-00538486d600", // Falso por enquanto (até termos login)
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
        const { data: leilao, error: erroLeilao } = await supabase
            .from('leiloes')
            .insert([{
                miniatura_id: miniatura.id,
                vendedor_id: "02abba15-1fb0-4330-b1ad-00538486d600", // Falso
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

        res.status(201).json({ mensagem: 'Leilão salvo no Supabase!', leilao });
    } catch (error) {
        console.error("Erro banco:", error);
        res.status(500).json({ erro: 'Falha ao salvar no banco.' });
    }
});

// 📦 ROTA: Listar Vitrine (Home)
app.get('/api/leiloes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('leiloes')
            .select('id, preco_inicial, lance_atual, data_fim, status, miniaturas(titulo, fotos, serie, is_th, is_sth)')
            .in('status', ['agendado', 'ativo'])
            .order('data_fim', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao buscar dados.' });
    }
});

// 📦 ROTA: Buscar 1 Leilão (Sala Dinâmica)
app.get('/api/leiloes/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('leiloes')
            .select('id, preco_inicial, lance_atual, data_fim, status, miniaturas(titulo, fotos, serie, is_th, is_sth)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ erro: 'Leilão não encontrado.' });
    }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const tabelaIncrementos = [
    {piso: 500000, incremento: 10000}, {piso: 100000, incremento: 2000}, {piso: 50000, incremento: 1000},
    {piso: 20000, incremento: 500}, {piso: 5000, incremento: 300}, {piso: 2000, incremento: 200},
    {piso: 1000, incremento: 100}, {piso: 500, incremento: 50}, {piso: 100, incremento: 30}, {piso: 0, incremento: 10}
];

function calcularProximoLanceMinimo(lanceAtual) {
    const faixa = tabelaIncrementos.find(t => lanceAtual >= t.piso) || tabelaIncrementos[tabelaIncrementos.length-1];
    return lanceAtual + faixa.incremento;
}

// 🎧 WebSocket (A Mágica do Tempo Real)
io.on('connection', (socket) => {
    socket.on('entrar_sala_leilao', async (leilaoId) => {
        socket.join(leilaoId);

        // Se o servidor reiniciou e não tem o cronômetro no cache, ele busca no Supabase!
        if (!leiloesAtivosCache[leilaoId]) {
            const { data } = await supabase.from('leiloes').select('lance_atual, data_fim').eq('id', leilaoId).single();
            if (data) {
                leiloesAtivosCache[leilaoId] = { lanceAtual: data.lance_atual, dataFim: new Date(data.data_fim).getTime() };
            }
        }

        if (leiloesAtivosCache[leilaoId]) {
            socket.emit('estado_inicial', leiloesAtivosCache[leilaoId]);
        }
    });

    socket.on('enviar_lance', async (dadosLance) => {
        const leilao = leiloesAtivosCache[dadosLance.leilaoId];
        if (!leilao) return socket.emit('erro_lance', {msg: 'Leilão não encontrado.'});

        const agora = Date.now();
        const tempoRestanteMs = leilao.dataFim - agora;

        if (tempoRestanteMs <= 0) return socket.emit('erro_lance', {msg: 'Este leilão já foi encerrado.'});
        if (tempoRestanteMs <= 15000) return socket.emit('erro_lance', {msg: 'Zona Morta: Não é possível dar lances nos últimos 15 segundos!'});

        const lanceMinimo = calcularProximoLanceMinimo(leilao.lanceAtual);
        if (dadosLance.valor < lanceMinimo) {
            return socket.emit('erro_lance', {msg: `O valor mínimo é R$ ${(lanceMinimo / 100).toFixed(2)}`});
        }

        // Passou pelas regras! Atualiza o cache e aplica Anti-Sniper
        leilao.lanceAtual = dadosLance.valor;
        let tempoEstendido = false;
        if (tempoRestanteMs <= 30000) {
            leilao.dataFim = agora + 30000;
            tempoEstendido = true;
            // Atualiza o tempo no banco
            await supabase.from('leiloes').update({ data_fim: new Date(leilao.dataFim).toISOString() }).eq('id', dadosLance.leilaoId);
        }

        // 💾 SALVA O LANCE NO BANCO DE DADOS OFICIAL E ATUALIZA O LEILÃO
        await supabase.from('leiloes').update({ lance_atual: dadosLance.valor }).eq('id', dadosLance.leilaoId);

        await supabase.from('lances').insert([{
            leilao_id: dadosLance.leilaoId,
            usuario_id: "02abba15-1fb0-4330-b1ad-00538486d600", // Falso até ter login
            valor: dadosLance.valor
        }]);

        io.to(dadosLance.leilaoId).emit('novo_lance_aceito', {
            valor: dadosLance.valor,
            usuario: dadosLance.isAnonimo ? 'Licitante Anônimo' : dadosLance.apelido,
            novoDataFim: leilao.dataFim,
            tempoEstendido: tempoEstendido
        });
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} conectado ao Supabase 🚀`));