'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {supabase} from '../lib/supabaseClient';

export default function HomeMarketplace() {
    const [leiloes, setLeiloes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVendedor, setIsVendedor] = useState(false);

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
            try {
                const resposta = await fetch('http://localhost:3001/api/leiloes');
                if (resposta.ok) {
                    const dados = await resposta.json();
                    setLeiloes(dados);
                }
            } catch (error) {
                console.error("Erro de conexão", error);
            } finally {
                setLoading(false);
            }
        };

        checarUsuario();
        buscarLeiloes();
    }, []);

    const formatarDinheiro = (centavos) => {
        return (centavos / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    };

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <p className="text-center text-gray-500 mt-20 animate-pulse">Buscando máquinas na garagem...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {leiloes.map((leilao) => (
                            <Link href={`/leilao/${leilao.id}`} key={leilao.id} className="group cursor-pointer">
                                <div
                                    className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.15)] flex flex-col h-full">

                                    {/* Área da Foto */}
                                    <div
                                        className="h-48 bg-gray-700 relative flex items-center justify-center overflow-hidden">
                                        {leilao.miniaturas?.fotos?.[0] ? (
                                            <img src={leilao.miniaturas.fotos[0]} alt="Carro"
                                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                        ) : (
                                            <span className="text-gray-500 font-bold">Sem Imagem</span>
                                        )}

                                        {/* Tags Especiais (STH / TH) */}
                                        {leilao.miniaturas?.is_sth && (
                                            <span
                                                className="absolute top-3 right-3 bg-pink-600 text-white text-xs font-black px-2 py-1 rounded-md shadow-md">
                                                $TH
                                            </span>
                                        )}
                                    </div>

                                    {/* Informações do Leilão */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                                            {leilao.miniaturas?.serie || 'Mainline'}
                                        </p>
                                        <h3 className="text-lg font-bold text-white leading-tight mb-4 flex-1">
                                            {leilao.miniaturas?.titulo || 'HotWheels Misterioso'}
                                        </h3>

                                        <div
                                            className="flex justify-between items-end pt-4 border-t border-gray-700/50">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Lance Atual</p>
                                                <p className="text-xl font-black text-green-400">
                                                    {formatarDinheiro(leilao.lance_atual)}
                                                </p>
                                            </div>
                                            <div className="bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">
                                                <p className="text-xs text-orange-400 font-bold">Ver Sala ➔</p>
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