'use client';

import {useState, useEffect, use} from 'react';
import {useRouter} from 'next/navigation';
import Link from "next/link";
import {supabase} from '../../../../lib/supabaseClient';

export default function EditarLeilao({params}) {
    const router = useRouter();
    const parametros = use(params);
    const leilaoId = parametros.id;

    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [autorizado, setAutorizado] = useState(false);

    const [form, setForm] = useState({
        titulo: '',
        serie: 'Mainline',
        is_th: false,
        is_sth: false,
        foto_url: ''
    });

    useEffect(() => {
        const carregarDadosEVerificarPermissao = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) return router.replace('/login');

            try {
                // Busca o leilão atual
                const resposta = await fetch(`http://localhost:3001/api/leiloes/${leilaoId}`);
                const dadosLeilao = await resposta.json();

                // Segurança: Se não for o dono, chuta pra fora!
                if (session.user.id !== dadosLeilao.vendedor_id) {
                    alert('Você não tem permissão para editar este leilão.');
                    return router.replace('/');
                }

                // Preenche o formulário com os dados que vieram do banco
                setForm({
                    titulo: dadosLeilao.miniaturas.titulo,
                    serie: dadosLeilao.miniaturas.serie,
                    is_th: dadosLeilao.miniaturas.is_th,
                    is_sth: dadosLeilao.miniaturas.is_sth,
                    foto_url: dadosLeilao.miniaturas.fotos[0] || ''
                });

                setAutorizado(true);
            } catch (error) {
                setMensagem('❌ Erro ao buscar os dados.');
            }
        };

        carregarDadosEVerificarPermissao();
    }, [leilaoId, router]);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setForm({...form, [name]: type === 'checkbox' ? checked : value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensagem('');

        try {
            const resposta = await fetch(`http://localhost:3001/api/leiloes/${leilaoId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(form)
            });

            if (resposta.ok) {
                setMensagem('✅ Informações atualizadas com sucesso!');
                setTimeout(() => router.push(`/leilao/${leilaoId}`), 1500); // Volta pra sala após 1.5s
            } else {
                setMensagem('❌ Erro ao atualizar.');
            }
        } catch (erro) {
            setMensagem('❌ Erro de conexão com o servidor.');
        }
        setLoading(false);
    };

    if (!autorizado) return <div
        className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Carregando oficina...</div>;

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="absolute top-8 left-8">
                <Link href={`/leilao/${leilaoId}`}
                      className="text-gray-400 hover:text-orange-500 font-bold flex items-center gap-2">
                    <span>←</span> Voltar para a Sala
                </Link>
            </div>

            <div className="max-w-3xl mx-auto mt-10 bg-gray-800 p-8 rounded-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-2">Editar Miniatura</h1>
                <p className="text-orange-400 text-sm mb-6 font-semibold">⚠️ Regra de Segurança: Preço e Tempo não podem
                    ser alterados após a criação.</p>

                {mensagem && (
                    <div
                        className="mb-6 p-4 rounded-lg bg-gray-700 font-bold text-center border border-gray-600">{mensagem}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Título</label>
                        <input type="text" name="titulo" required onChange={handleChange} value={form.titulo}
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500"/>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Link da Foto</label>
                        <input type="url" name="foto_url" required onChange={handleChange} value={form.foto_url}
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500"/>
                    </div>

                    <div className="flex gap-6 border-y border-gray-700 py-6">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Série</label>
                            <select name="serie" onChange={handleChange} value={form.serie}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
                                <option>Mainline</option>
                                <option>Premium / Car Culture</option>
                                <option>Red Line Club (RLC)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-6 pt-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="is_th" onChange={handleChange} checked={form.is_th}
                                       className="w-5 h-5 accent-orange-500"/>
                                <span className="text-gray-300 font-bold">TH</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="is_sth" onChange={handleChange} checked={form.is_sth}
                                       className="w-5 h-5 accent-orange-500"/>
                                <span className="text-pink-500 font-bold">$TH</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold text-xl py-4 rounded-xl transition-all">
                        {loading ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
                    </button>
                </form>
            </div>
        </div>
    );
}