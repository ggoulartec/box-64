'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '../../lib/supabaseClient';

export default function LoginPage() {
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [apelido, setApelido] = useState('');
    const [tipoUsuario, setTipoUsuario] = useState('comprador'); // NOVO: Estado para o tipo de conta
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        try {
            if (isLogin) {
                // 🔥 LÓGICA DE LOGIN
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: senha,
                });

                if (error) throw error;

                const { data: perfil } = await supabase
                    .from('perfis')
                    .select('tipo_usuario')
                    .eq('id', data.user.id)
                    .single();

                if (perfil?.tipo_usuario === 'vendedor') {
                    router.push('/admin/novo-leilao');
                } else {
                    router.push('/');
                }

            } else {
                // ✨ LÓGICA DE CADASTRO BLINDADA

                // 1. Verifica se o apelido já existe ANTES de criar a conta
                const { data: apelidoEmUso } = await supabase
                    .from('perfis')
                    .select('apelido')
                    .eq('apelido', apelido)
                    .maybeSingle();

                if (apelidoEmUso) {
                    throw new Error('Esse apelido já está em uso! Escolha outro.');
                }

                // 2. Se o apelido está livre, cria a conta no Auth
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: senha,
                });

                if (error) throw error;

                // 3. Salva o perfil com a certeza de que não vai dar erro
                if (data.user) {
                    const { error: erroPerfil } = await supabase
                        .from('perfis')
                        .insert([
                            { id: data.user.id, apelido: apelido, tipo_usuario: tipoUsuario }
                        ]);

                    if (erroPerfil) throw erroPerfil; // Agora, se der erro aqui, a tela avisa!
                }

                alert(`Conta de ${tipoUsuario.toUpperCase()} criada com sucesso! Faça login.`);
                setIsLogin(true);
            }
        } catch (error) {
            // Qualquer erro (seja de e-mail, senha fraca ou apelido) cai aqui e aparece vermelho na tela
            setErro(error.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#121212] flex flex-col justify-center items-center p-4 font-sans text-gray-100">
            <div className="absolute top-8 left-8">
                <Link href="/"
                      className="text-gray-400 hover:text-orange-500 font-bold flex items-center gap-2 transition-colors">
                    <span>←</span> Voltar para a Vitrine
                </Link>
            </div>

            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white tracking-tight">Box<span
                        className="text-orange-500">64</span></h1>
                    <p className="text-gray-400 mt-2 font-medium">
                        {isLogin ? 'Acesso restrito.' : 'Escolha seu caminho.'}
                    </p>
                </div>

                {erro && (
                    <div
                        className="mb-4 bg-red-900/50 text-red-300 p-3 rounded-lg border border-red-700 text-sm font-semibold text-center">
                        ⚠️ {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ESCOLHA DE CONTA (Só no Cadastro) */}
                    {!isLogin && (
                        <div className="flex gap-4 mb-4">
                            <label
                                className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${tipoUsuario === 'comprador' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900'}`}>
                                <input type="radio" name="tipo" value="comprador" className="hidden"
                                       onChange={() => setTipoUsuario('comprador')}/>
                                <span
                                    className={`block font-bold ${tipoUsuario === 'comprador' ? 'text-orange-500' : 'text-gray-400'}`}>🛍️ Quero Comprar</span>
                            </label>

                            <label
                                className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${tipoUsuario === 'vendedor' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900'}`}>
                                <input type="radio" name="tipo" value="vendedor" className="hidden"
                                       onChange={() => setTipoUsuario('vendedor')}/>
                                <span
                                    className={`block font-bold ${tipoUsuario === 'vendedor' ? 'text-orange-500' : 'text-gray-400'}`}>🏷️ Quero Vender</span>
                            </label>
                        </div>
                    )}

                    {!isLogin && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 font-semibold">Como quer ser
                                chamado?</label>
                            <input type="text" required value={apelido} onChange={(e) => setApelido(e.target.value)}
                                   placeholder="Ex: ColecionadorBR"
                                   className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"/>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-semibold">E-mail</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                               placeholder="seu@email.com"
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"/>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-semibold">Senha</label>
                        <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
                               placeholder="••••••••"
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"/>
                    </div>

                    <button type="submit" disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold text-lg py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] mt-4">
                        {loading ? 'Processando...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-700 pt-6">
                    <button onClick={() => {
                        setIsLogin(!isLogin);
                        setErro('');
                    }} type="button" className="text-orange-500 font-bold hover:underline focus:outline-none">
                        {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
                    </button>
                </div>

            </div>
        </div>
    );
}