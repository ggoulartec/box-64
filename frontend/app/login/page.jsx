'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    // Estados para controlar o formulário
    const [isLogin, setIsLogin] = useState(true); // true = Tela de Login, false = Tela de Cadastro
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [apelido, setApelido] = useState(''); // Só usado no cadastro
    const [loading, setLoading] = useState(false);

    // Função falsa por enquanto (Apenas para testarmos o visual)
    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        console.log("Modo:", isLogin ? "LOGIN" : "CADASTRO");
        console.log("Dados:", { email, senha, apelido });

        // Simula um carregamento de 2 segundos
        setTimeout(() => {
            setLoading(false);
            alert(isLogin ? "Simulação: Login com sucesso!" : "Simulação: Conta criada!");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col justify-center items-center p-4 font-sans text-gray-100">

            {/* Botão de Voltar para a Home */}
            <div className="absolute top-8 left-8">
                <Link href="/" className="text-gray-400 hover:text-orange-500 font-bold flex items-center gap-2 transition-colors">
                    <span>←</span> Voltar para a Vitrine
                </Link>
            </div>

            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">

                {/* Cabeçalho / Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        Box<span className="text-orange-500">64</span>
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">
                        {isLogin ? 'Bem-vindo de volta à garagem.' : 'Sua garagem de colecionáveis começa aqui.'}
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Campo Apelido (Só aparece no Cadastro) */}
                    {!isLogin && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 font-semibold">Como quer ser chamado?</label>
                            <input
                                type="text"
                                required
                                value={apelido}
                                onChange={(e) => setApelido(e.target.value)}
                                placeholder="Ex: ColecionadorBR"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    {/* Campo E-mail */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-semibold">E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Campo Senha */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-semibold">Senha</label>
                        <input
                            type="password"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Botão de Ação */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold text-lg py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] mt-4"
                    >
                        {loading ? 'Acelerando...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
                    </button>
                </form>

                {/* Alternador Login / Cadastro */}
                <div className="mt-8 text-center border-t border-gray-700 pt-6">
                    <p className="text-gray-400">
                        {isLogin ? "Ainda não tem as chaves da garagem?" : "Já possui uma garagem conosco?"}
                    </p>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        type="button"
                        className="text-orange-500 font-bold mt-2 hover:underline focus:outline-none"
                    >
                        {isLogin ? "Criar minha conta agora" : "Fazer login na minha conta"}
                    </button>
                </div>

            </div>
        </div>
    );
}