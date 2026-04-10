'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {supabase} from '../lib/supabaseClient';

export default function HomeMarketplace() {
    const [leiloes, setLeiloes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVendedor, setIsVendedor] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState('ativos');

    useEffect(() => {
        // 1. Verifica quem está logado
        const checarUsuario = async () => {
            const {data: {session}} = await supabase.auth.getSession();

            if (session) {
                // Se tem alguém logado, descobre o tipo de conta
                const {data: perfil} = await supabase
                    .from('perfis')
                    .select('tipo_usuario')
                    .eq('id', session.user.id)
                    .single();

                if (perfil?.tipo_usuario === 'vendedor') {
                    setIsVendedor(true); // 🟢 Libera o botão!
                }
            }
        };

        // 2. Busca os leilões
        const buscarLeiloes = async () => {
            setLoading(true);
            try {
                const resposta = await fetch(`http://localhost:3001/api/leiloes?aba=${abaAtiva}`);
                if (resposta.ok) {
                    const dados = await resposta.json();
                    setLeiloes(dados);
                }
            } finally {
                setLoading(false);
            }
        };

        checarUsuario();
        buscarLeiloes();
    }, [abaAtiva]);

    const formatarDinheiro = (centavos) => {
        return (centavos / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    };

    const formatarData = (dataIso) => {
        return new Date(dataIso).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex gap-4 mb-8 border-b border-gray-800 pb-4">
                    <button
                        onClick={() => setAbaAtiva('ativos')}
                        className={`px-4 py-2 font-bold rounded-lg transition ${abaAtiva === 'ativos' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        🔥 Ativos
                    </button>
                    <button
                        onClick={() => setAbaAtiva('recentes')}
                        className={`px-4 py-2 font-bold rounded-lg transition ${abaAtiva === 'recentes' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        🏁 Finalizados (24h)
                    </button>
                    <button
                        onClick={() => setAbaAtiva('arquivo')}
                        className={`px-4 py-2 font-bold rounded-lg transition ${abaAtiva === 'arquivo' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        📚 Arquivo (30 dias)
                    </button>
                </div>
                {loading ? (
                    <p className="text-center text-gray-500 mt-20 animate-pulse">Buscando máquinas na garagem...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {leiloes.map((leilao) => (
                            <Link href={`/leilao/${leilao.id}`} key={leilao.id}
                                  className="group cursor-pointer flex flex-col h-full">
                                <div
                                    className={`rounded-2xl overflow-hidden border transition-all shadow-lg flex flex-col h-full relative ${leilao.status === 'ativo' ? 'bg-gray-800 border-gray-700 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.15)]' : 'bg-gray-800/50 border-gray-800 opacity-90 hover:opacity-100'}`}>

                                    {/* Área da Foto */}
                                    <div
                                        className="h-48 bg-gray-900 relative flex items-center justify-center overflow-hidden">

                                        {/* NOVO: Tag de Status (Ao Vivo / Finalizado) */}
                                        <div className="absolute top-3 left-3 z-10">
                                            {leilao.status === 'ativo' ? (
                                                <span
                                                    className="bg-green-500/90 text-white text-[10px] font-black px-2 py-1 rounded shadow-md flex items-center gap-1.5 backdrop-blur-sm tracking-wider">
                                                    <span
                                                        className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> AO VIVO
                                                </span>
                                            ) : (
                                                <span
                                                    className="bg-gray-950/80 text-gray-400 text-[10px] font-black px-2 py-1 rounded shadow-md border border-gray-700 backdrop-blur-sm tracking-wider">
                                                    FINALIZADO
                                                </span>
                                            )}
                                        </div>

                                        {leilao.miniaturas?.fotos?.[0] ? (
                                            <img src={leilao.miniaturas.fotos[0]} alt="Carro"
                                                 className={`w-full h-full object-cover transition-transform duration-500 ${leilao.status === 'ativo' ? 'group-hover:scale-105' : 'grayscale-[20%]'}`}/>
                                        ) : (
                                            <span className="text-gray-600 font-bold text-sm uppercase tracking-widest">Sem Imagem</span>
                                        )}

                                        {/* Tags Especiais (STH / TH) */}
                                        {leilao.miniaturas?.is_sth && (
                                            <span
                                                className="absolute top-3 right-3 bg-pink-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md z-10">
                                                $TH
                                            </span>
                                        )}
                                    </div>

                                    {/* Informações do Leilão */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                                {leilao.miniaturas?.serie || 'Mainline'}
                                            </p>
                                            {/* NOVO: Mostra a data fim */}
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {leilao.status === 'ativo' ? 'Termina ' : 'Terminou '}{formatarData(leilao.data_fim)}
                                            </p>
                                        </div>

                                        <h3 className="text-lg font-bold text-white leading-tight mb-4 flex-1">
                                            {leilao.miniaturas?.titulo || 'HotWheels Misterioso'}
                                        </h3>

                                        <div
                                            className="flex justify-between items-end pt-4 border-t border-gray-700/50 mt-auto">
                                            <div>
                                                {/* NOVO: Textos dinâmicos baseados no status */}
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">
                                                    {leilao.status === 'ativo' ? 'Lance Atual' : 'Arrematado por'}
                                                </p>
                                                <p className={`text-xl font-black ${leilao.status === 'ativo' ? 'text-green-400' : 'text-orange-500'}`}>
                                                    {formatarDinheiro(leilao.lance_atual)}
                                                </p>

                                                {/* NOVO: Nome do Vencedor (Aparece só se estiver finalizado e tiver ganhador) */}
                                                {leilao.status === 'finalizado' && (
                                                    <p className="text-xs text-gray-400 mt-1 font-medium">
                                                        Vencedor: <span
                                                        className="text-gray-200 font-bold">{leilao.perfis?.apelido || 'Ninguém'}</span>
                                                    </p>
                                                )}
                                            </div>

                                            <div
                                                className={`px-3 py-1.5 rounded-lg border transition-colors ${leilao.status === 'ativo' ? 'bg-orange-500/10 border-orange-500/30 group-hover:bg-orange-500 group-hover:text-white text-orange-500' : 'bg-gray-900 border-gray-700 text-gray-400 group-hover:bg-gray-700 group-hover:text-white'}`}>
                                                <p className="text-xs font-bold transition-inherit">
                                                    {leilao.status === 'ativo' ? 'Dar Lance ➔' : 'Ver Sala'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}