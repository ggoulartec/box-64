const { Socket } = require("dgram");
const express = require("express");
const http = require("http");
const { Server } = require('socket.io');

// Inicialização do App
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Configuração do WebSocket (realtime)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Ouvindo conexões dos usuários na sala de leilão
io.on('connection', (socket) => {
    console.log(`Colecionador conectado: ${socket.id}`);

    // Usuário entra napágina de uma miniatura específica
    socket.on('entrar_sala_leilao', (leilaoId) => {
        socket.join(leilaoId);
        console.log(`Usuário ${socket.id} entrou no leilão ${leilaoId}`);
    });

    // Recebendo um lance
    socket.on('enviar_lance', async (dadosLance) => {
        io.to(dadosLance.leilaoId).emit('novo_lance_aceito', {
            valor: dadosLance.valor,
            usuario: dadosLance.isAnonimo ? 'Lance Anônimo' : dadosLance.apelido
        });
    });

    socket.on('disconnect', () => {
        console.log(`Colecionador desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor de leilões rodando na porta ${PORT} 🏎️💨`);
});