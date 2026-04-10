'use client';

import {use, useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import {supabase} from '../../../lib/supabaseClient';
import Link from "next/link";

const socket = io('http://localhost:3001');

export default function SalaDeLeilao({params}) {
    const parametros = use(params);
    const leilaoId = parametros.id;
    const [carro, setCarro] = useState(null);
    const [lanceAtual, setLanceAtual] = useState(0);
    const [tempoRestante, setTempoRestante] = useState(0);
    const [historico, setHistorico] = useState([]);
    const [mensagemErro, setMensagemErro] = useState('');
    const [sessao, setSessao] = useState(null);
    const [meuApelido, setMeuApelido] = useState('');
    const [vencedorOficial, setVencedorOficial] = useState(null);
    const [statusLeilao, setStatusLeilao] = useState('ativo');
    const [dadosLeilao, setDadosLeilao] = useState(null); // Vai guardar os dados gerais

    const atualizarRelogio = (dataFimMs) => {
        const intervalo = setInterval(() => {
            const agora = Date.now();
            const diff = Math.max(0, Math.floor((dataFimMs - agora) / 1000));
            setTempoRestante(diff);
            if (diff <= 0) clearInterval(intervalo);
        }, 1000);
    };

    useEffect(() => {
        // 1. Busca os detalhes visuais do carro na nossa nova Rota da API
        const carregarUsuario = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (session) {
                setSessao(session);
                const {data} = await supabase.from('perfis').select('apelido').eq('id', session.user.id).single();
                if (data) setMeuApelido(data.apelido);
            }
        };

        const buscarDetalhesDoCarro = async () => {
            try {
                const resposta = await fetch(`http://localhost:3001/api/leiloes/${leilaoId}`);
                if (resposta.ok) {
                    const dados = await resposta.json();
                    setCarro(dados.miniaturas);
                    setStatusLeilao(dados.status);
                    setDadosLeilao(dados);
                }
            } catch (error) {
                console.error("Erro ao buscar detalhes:", error);
            }
        };

        const buscarHistoricoDeLances = async () => {
            try {
                const resposta = await fetch(`http://localhost:3001/api/leiloes/${leilaoId}/lances`);
                if (resposta.ok) {
                    const dados = await resposta.json();
                    setHistorico(dados);
                }
            } catch (error) {
                console.error("Erro ao buscar histórico:", error);
            }
        }

        carregarUsuario();
        buscarDetalhesDoCarro();
        buscarHistoricoDeLances();

        // 2. Conecta no WebSocket para a mágica do tempo real
        socket.emit('entrar_sala_leilao', leilaoId);

        socket.on('estado_inicial', (estado) => {
            setLanceAtual(estado.lanceAtual);
            const diff = Math.max(0, Math.floor((estado.dataFim - Date.now()) / 1000));
            setTempoRestante(diff);
        });

        socket.on('novo_lance_aceito', (dados) => {
            setLanceAtual(dados.valor);
            const diff = Math.max(0, Math.floor((dados.novoDataFim - Date.now()) / 1000));
            setTempoRestante(diff);

            setHistorico(prev => [{
                usuario: dados.usuario,
                valor: dados.valor,
                hora: new Date().toLocaleTimeString()
            }, ...prev]);
        });

        socket.on('leilao_finalizado', (dados) => {
            setVencedorOficial(dados);
            setStatusLeilao('finalizado');
            setTempoRestante(0);
            alert(`🔨 MARTELO BATIDO! Vencedor: ${dados.vencedor}`);
        });

        return () => {
            socket.off('estado_inicial');
            socket.off('novo_lance_aceito');
            socket.off('leilao_finalizado');
        };
    }, [leilaoId]);

    useEffect(() => {
        if (statusLeilao === 'finalizado' && historico.length > 0 && !vencedorOficial) {
            setVencedorOficial({
                vencedor: historico[0].usuario,
                valorFinal: historico[0].valor
            });
        }
    }, [statusLeilao, historico]);

    useEffect(() => {
        if (tempoRestante <= 0) {
            if (statusLeilao === 'ativo' && carro) {
                socket.emit('encerrar_leilao', leilaoId);
            }
            return;
        }
        ;

        const timer = setInterval(() => {
            setTempoRestante(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [tempoRestante, leilaoId, carro, statusLeilao]);

    const handleDarLance = () => {
        const proximoValor = lanceAtual + 5000;
        socket.emit('enviar_lance', {
            leilaoId: leilaoId,
            usuarioId: sessao.user.id,
            apelido: meuApelido,
            valor: proximoValor,
            isAnonimo: false
        });
    };

    const formatarDinheiro = (centavos) => {
        return (centavos / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    };

    const formatarTempo = (totalSegundos) => {
        if (totalSegundos <= 0) return "00d 00h 00m 00s";

        const d = Math.floor(totalSegundos / (3600 * 24));
        const h = Math.floor((totalSegundos % (3600 * 24)) / 3600);
        const m = Math.floor((totalSegundos % 3600) / 60);
        const s = totalSegundos % 60;

        // Visual mais limpo, sem os ":"
        return `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };

    const corRelogio = tempoRestante <= 15 ? 'text-red-500 animate-pulse' : 'text-white';

    // Enquanto o carro não carrega, mostramos uma tela preta limpa
    if (!carro) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Carregando
        a máquina...</div>;

    return (
        <div className="bg-[#121212] text-gray-100 p-8 flex flex-col md:flex-row gap-8 font-sans">
            {/* COLUNA ESQUERDA: A Miniatura (Agora Dinâmica!) */}
            <div className="flex-1 bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
                <div
                    className="w-full h-[500px] bg-gray-900 rounded-xl mb-6 flex items-center justify-center overflow-hidden border border-gray-700 relative">
                    {carro.fotos && carro.fotos[0] ? (
                        <img src={carro.fotos[0]} alt={carro.titulo} className="w-full h-full object-contain"/>
                    ) : (
                        <span className="text-gray-500 text-xl">[ Sem Foto Cadastrada ]</span>
                    )}

                    {/* Tag visual de STH/TH na foto se existir */}
                    {carro.is_sth && (
                        <span
                            className="absolute top-4 right-4 bg-pink-600 text-white font-black px-3 py-1 rounded shadow-lg text-sm border border-pink-400">
                            $TH
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-3xl font-bold text-white">{carro.titulo}</h1>

                    {/* O botão Mágico que só o Dono vê! */}
                    {sessao?.user?.id === dadosLeilao?.vendedor_id && dadosLeilao?.status === 'ativo' && (
                        <Link href={`/admin/editar-leilao/${leilaoId}`}
                              className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold py-1.5 px-4 rounded-lg border border-gray-600 transition-colors">
                            ✏️ Editar Info
                        </Link>
                    )}
                </div>
            </div>

            {/* COLUNA DIREITA: Command Center */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700 text-center">
                    <p className="text-gray-400 mb-1 uppercase tracking-widest text-sm">Tempo Restante</p>
                    <div
                        className={`text-3xl lg:text-4xl font-black font-mono mb-6 tracking-tighter whitespace-nowrap ${corRelogio}`}>
                        {formatarTempo(tempoRestante)}
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
                        disabled={tempoRestante === 0 || !sessao}
                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold text-2xl py-5 rounded-xl transition-all transform active:scale-95 shadow-[0_0_15px_rgba(234,88,12,0.5)]"
                    >
                        {tempoRestante === 0
                            ? 'LEILÃO ENCERRADO'
                            : (!sessao ? '🔐 FAÇA LOGIN PARA LANCE' : 'DAR LANCE')}
                    </button>
                </div>

                <div
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex-1 overflow-hidden flex flex-col min-h-105.5 max-h-105.5">
                    <h3 className="items-center text-lg font-bold mb-4 border-b border-gray-700 pb-2 flex justify-between">
                        Histórico de Lances
                        {vencedorOficial && <span className="text-orange-500 text-sm">FINALIZADO</span>}
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3">
                        {/* CARD DE VENCEDOR (Aparece apenas quando o leilão fecha) */}
                        {vencedorOficial && (
                            <div
                                className="bg-orange-500/20 border-2 border-orange-500 p-4 rounded-xl mb-4 mt-6.25 animate-bounce">
                                <p className="text-orange-500 text-xs font-black uppercase text-center">🏆 ARREMATADO POR
                                    🏆</p>
                                <p className="text-white text-xl font-bold text-center">{vencedorOficial.vencedor}</p>
                                <p className="text-orange-400 text-center font-mono font-bold">{formatarDinheiro(vencedorOficial.valorFinal)}</p>
                            </div>
                        )}

                        {historico.length === 0 ? (
                            <p className="text-gray-500 text-center mt-10">Nenhum lance ainda.</p>
                        ) : (
                            historico.map((h, i) => (
                                <div key={i}
                                     className={`flex justify-between items-center p-3 rounded-lg ${vencedorOficial?.vencedor === h.usuario ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-gray-700/50'}`}>
                                    <div>
                                        <p className={`font-bold ${vencedorOficial?.vencedor === h.usuario ? 'text-orange-400' : 'text-gray-200'}`}>
                                            {h.usuario} {vencedorOficial?.vencedor === h.usuario && "👑"}
                                        </p>
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