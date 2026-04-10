'use client'; // Avisa o Next.js que esta tela precisa rodar no navegador para ter interatividade

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Conecta ao nosso servidor Node.js (depois trocamos pela URL do Render)
const socket = io('http://localhost:3001');

export default function SalaDeLeilao({ params }) {
    const leilaoId = params.id || "leilao_datsun_123";

    // Estados da nossa tela
    const [lanceAtual, setLanceAtual] = useState(0);
    const [tempoRestante, setTempoRestante] = useState(0);
    const [historico, setHistorico] = useState([]);
    const [mensagemErro, setMensagemErro] = useState('');

    // Função para manter o relógio rodando na tela
    const atualizarRelogio = (dataFimMs) => {
        const intervalo = setInterval(() => {
            const agora = Date.now();
            const diff = Math.max(0, Math.floor((dataFimMs - agora) / 1000));
            setTempoRestante(diff);

            if (diff <= 0) clearInterval(intervalo);
        }, 1000);
    };

    // Efeito que roda assim que a página abre
    useEffect(() => {
        // 1. Entra na sala
        socket.emit('entrar_sala_leilao', leilaoId);

        // 2. Recebe o estado atual assim que entra
        socket.on('estado_inicial', (estado) => {
            setLanceAtual(estado.lanceAtual);
            atualizarRelogio(estado.dataFim);
        });

        // 3. Ouve quando QUALQUER PESSOA dá um lance com sucesso
        socket.on('novo_lance_aceito', (dados) => {
            setLanceAtual(dados.valor);
            atualizarRelogio(dados.novoDataFim);

            // Adiciona no topo do histórico
            setHistorico(prev => [{
                usuario: dados.usuario,
                valor: dados.valor,
                hora: new Date().toLocaleTimeString()
            }, ...prev]);

            // Efeito visual de Anti-Sniper
            if (dados.tempoEstendido) {
                console.log("⏱️ Tempo estendido! Regra Anti-Sniper ativada.");
            }
        });

        // 4. Ouve se o NOSSO lance deu erro (Zona Morta, valor baixo, etc)
        socket.on('erro_lance', (erro) => {
            setMensagemErro(erro.msg);
            setTimeout(() => setMensagemErro(''), 3000); // Limpa o erro após 3s
        });

        // Limpa a conexão ao sair da página
        return () => {
            socket.off('estado_inicial');
            socket.off('novo_lance_aceito');
            socket.off('erro_lance');
        };
    }, [leilaoId]);

    // Função do botão gigante laranja
    const handleDarLance = () => {
        // Simulando o cálculo do próximo lance no frontend só para enviar o valor certo
        const proximoValor = lanceAtual + 5000; // Ex: Incremento fixo de R$ 50 para o teste

        socket.emit('enviar_lance', {
            leilaoId: leilaoId,
            usuarioId: 'meu_usuario_falso_123', // Depois virá do Supabase Auth
            apelido: 'ColecionadorBR',
            valor: proximoValor,
            isAnonimo: false
        });
    };

    // Formata o dinheiro (de centavos para Reais)
    const formatarDinheiro = (centavos) => {
        return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Cores de alerta para o relógio
    const corRelogio = tempoRestante <= 15 ? 'text-red-500 animate-pulse' : 'text-white';

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 flex flex-col md:flex-row gap-8 font-sans">

            {/* COLUNA ESQUERDA: A Miniatura */}
            <div className="flex-1 bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
                <div className="w-full h-96 bg-gray-700 rounded-xl mb-6 flex items-center justify-center">
                    <span className="text-gray-500 text-xl">[ Foto Gigante do Datsun 510 STH ]</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Datsun Bluebird 510</h1>
                <p className="text-gray-400">Série: Super Treasure Hunt (2021) • Estado: Lacrado</p>
            </div>

            {/* COLUNA DIREITA: Command Center (Onde o dinheiro rola) */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">

                {/* Painel do Relógio e Lance */}
                <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700 text-center">
                    <p className="text-gray-400 mb-1 uppercase tracking-widest text-sm">Tempo Restante</p>
                    <div className={`text-6xl font-black font-mono mb-6 ${corRelogio}`}>
                        {tempoRestante}s
                    </div>

                    <p className="text-gray-400 mb-1 uppercase tracking-widest text-sm">Lance Atual</p>
                    <div className="text-4xl font-bold text-green-400 mb-6">
                        {formatarDinheiro(lanceAtual)}
                    </div>

                    {mensagemErro && (
                        <div
                            className="bg-red-900/50 text-red-300 p-3 rounded-lg border border-red-700 mb-4 text-sm font-semibold">
                            ⚠️ {mensagemErro}
                        </div>
                    )}

                    <button
                        onClick={handleDarLance}
                        disabled={tempoRestante === 0}
                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold text-2xl py-5 rounded-xl transition-all transform active:scale-95 shadow-[0_0_15px_rgba(234,88,12,0.5)]"
                    >
                        {tempoRestante === 0 ? 'LEILÃO ENCERRADO' : 'DAR LANCE'}
                    </button>
                </div>

                {/* Feed de Histórico ao Vivo */}
                <div className="max-h-[539px] bg-gray-800 p-6 rounded-2xl border border-gray-700 flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Histórico de Lances</h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {historico.length === 0 ? (
                            <p className="text-gray-500 text-center mt-10">Nenhum lance ainda. Seja o primeiro!</p>
                        ) : (
                            historico.map((h, i) => (
                                <div key={i}
                                    className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-bold text-gray-200">{h.usuario}</p>
                                        <p className="text-xs text-gray-400">{h.hora}</p>
                                    </div>
                                    <div className="font-bold text-green-400">
                                        {formatarDinheiro(h.valor)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}