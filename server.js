const express = require("express");
const http = require("http");
const {Server} = require('socket.io');
const cors = require('cors');
const {createClient} = require('@supabase/supabase-js');

// Configuração do Supabase (Essas chaves ficarão seguras no painel do Render)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inicialização do App
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {cors: {origin: "*", methods: ["GET", "POST"]}});

// 🛠️ 1. Tabela de Incrementos (Em Centavos para evitar erros de ponto flutuante)
const tabelaIncrementos = [
    {piso: 10000000, incremento: 100000},
    {piso: 5000000, incremento: 50000},
    {piso: 2000000, incremento: 30000},
    {piso: 1000000, incremento: 20000},
    {piso: 500000, incremento: 10000},
    {piso: 100000, incremento: 2000},
    {piso: 50000, incremento: 1000},
    {piso: 20000, incremento: 500},
    {piso: 5000, incremento: 300},
    {piso: 2000, incremento: 200},
    {piso: 1000, incremento: 100},
    {piso: 500, incremento: 50},
    {piso: 100, incremento: 30},
    {piso: 0, incremento: 10}
];

function calcularProximoLanceMinimo(lanceAtual) {
    const faixa = tabelaIncrementos.find(t => lanceAtual >= t.piso);
    return lanceAtual + faixa.incremento;
}

// 🗄️ 2. Estado em Memória (Simulando o Redis/Banco para o MVP)
// Em produção, esses dados virão do Supabase quando o servidor iniciar
const leiloesAtivos = {
    "leilao_datsun_123": {
        lanceAtual: 4000, // R$ 40,00
        // Simulando um leilão que acaba daqui a 45 segundos
        dataFim: new Date(Date.now() + 45000).getTime()
    }
};

// 🎧 3. Ouvindo conexões dos usuários
io.on('connection', (socket) => {
    console.log(`Colecionador conectado: ${socket.id}`);

    socket.on('entrar_sala_leilao', (leilaoId) => {
        socket.join(leilaoId);
        console.log(`Usuário ${socket.id} entrou no leilão ${leilaoId}`);

        // Manda o estado atual para quem acabou de entrar
        if (leiloesAtivos[leilaoId]) {
            socket.emit('estado_inicial', leiloesAtivos[leilaoId]);
        }
    });

    // 🚀 4. O Coração da Regra de Negócio
    socket.on('enviar_lance', async (dadosLance) => {
        const leilao = leiloesAtivos[dadosLance.leilaoId];

        // Validação 1: O leilão existe?
        if (!leilao) return socket.emit('erro_lance', {msg: 'Leilão não encontrado.'});

        const agora = Date.now();
        const tempoRestanteMs = leilao.dataFim - agora;

        // Validação 2: Leilão já acabou?
        if (tempoRestanteMs <= 0) {
            return socket.emit('erro_lance', {msg: 'Este leilão já foi encerrado.'});
        }

        // Validação 3: 🛑 ZONA MORTA (15 segundos)
        if (tempoRestanteMs <= 15000) {
            return socket.emit('erro_lance', {msg: 'Zona Morta: Não é possível dar lances nos últimos 15 segundos!'});
        }

        // Validação 4: 💰 Cálculo do Incremento
        const lanceMinimo = calcularProximoLanceMinimo(leilao.lanceAtual);
        if (dadosLance.valor < lanceMinimo) {
            return socket.emit('erro_lance', {msg: `Lance muito baixo. O valor mínimo é R$ ${(lanceMinimo / 100).toFixed(2)}`});
        }

        // ✅ Se passou por tudo, o lance é válido!
        // Atualizamos o valor em memória (Bloqueio Otimista na prática)
        leilao.lanceAtual = dadosLance.valor;

        // Regra 5: ⏱️ ANTI-SNIPER
        // Se faltar menos de 30 segundos (lembrando que a zona morta é 15s),
        // nós empurramos o tempo final para que voltem a faltar 30 segundos.
        let tempoEstendido = false;
        if (tempoRestanteMs <= 30000) {
            leilao.dataFim = agora + 30000;
            tempoEstendido = true;
        }

        const {data, error} = await supabase
            .from('lances')
            .insert([
                {
                    leilao_id: dadosLance.leilaoId,
                    usuario_id: dadosLance.usuarioId,
                    valor: dadosLance.valor
                }
            ]);

        if (error) {
            // Se o banco falhar, revertemos o lance e avisamos o usuário
            console.error("Erro ao salvar lance:", error);
            return socket.emit('erro_lance', {msg: 'Erro ao registrar no banco. Tente novamente.'});
        }

        // Dispara o sucesso para TODOS na sala
        io.to(dadosLance.leilaoId).emit('novo_lance_aceito', {
            valor: dadosLance.valor,
            usuario: dadosLance.isAnonimo ? 'Licitante Anônimo' : dadosLance.apelido,
            novoDataFim: leilao.dataFim,
            tempoEstendido: tempoEstendido
        });
    });

    socket.on('disconnect', () => {
        console.log(`Colecionador desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🏎️💨`));