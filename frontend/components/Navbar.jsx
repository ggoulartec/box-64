'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '../lib/supabaseClient';

export default function Navbar() {
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [perfil, setPerfil] = useState(null);

    useEffect(() => {
        // 1. Função para buscar quem está logado
        const buscarSessao = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (session) {
                setUsuario(session.user);
                // Busca o apelido e o tipo
                const {data} = await supabase
                    .from('perfis')
                    .select('apelido, tipo_usuario')
                    .eq('id', session.user.id)
                    .single();
                setPerfil(data);
            }
        };

        buscarSessao();

        // 2. Fica ouvindo se o usuário fez login ou logout em outra tela
        const {data: authListener} = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                buscarSessao();
            } else {
                setUsuario(null);
                setPerfil(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* LOGO */}
                <div className="col items-center">
                    <Link href="/"
                          className="text-2xl font-black text-white tracking-tight hover:scale-105 transition-transform">
                        Box<span className="text-orange-500">64</span>
                    </Link>
                    <p className="text-gray-400">Leilões exclusivos de miniaturas 1:64.</p>
                </div>

                {/* CONTROLES DO USUÁRIO */}
                <div className="flex items-center gap-6">

                    {/* Se for Vendedor, mostra o botão de atalho */}
                    {perfil?.tipo_usuario === 'vendedor' && (
                        <Link href="/admin/novo-leilao"
                              className="hidden md:block text-sm font-bold text-orange-500 hover:text-orange-400 bg-orange-500/10 px-4 py-2 rounded-lg border border-orange-500/30 transition-colors">
                            + Vender Miniatura
                        </Link>
                    )}

                    {/* Estado de Login */}
                    {usuario ? (
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-200">{perfil?.apelido || 'Carregando...'}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold">{perfil?.tipo_usuario}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-bold text-sm py-2 px-4 rounded-lg transition-all"
                            >
                                Sair
                            </button>
                        </div>
                    ) : (
                        <Link href="/login"
                              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2 px-6 rounded-lg transition-all shadow-[0_0_10px_rgba(234,88,12,0.3)]">
                            Entrar na Garagem
                        </Link>
                    )}

                </div>
            </div>
        </nav>
    );
}