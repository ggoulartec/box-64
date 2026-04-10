'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '../../../lib/supabaseClient';
import Link from 'next/link';

export default function NovoLeilao() {
    const router = useRouter();
    const [sessao, setSessao] = useState(null);
    const [estoque, setEstoque] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState('');

    const [form, setForm] = useState({
        titulo_leilao: '',
        miniaturas_ids: [],
        preco_inicial: '',
        duracao_dias: '1',
        descricao_leilao: ''
    });

    useEffect(() => {
        const inicializar = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) return router.replace('/login');
            setSessao(session);
            buscarEstoque(session.user.id);
        };
        inicializar();
    }, [router]);

    const buscarEstoque = async (vendedorId) => {
        const res = await fetch(`http://localhost:3001/api/miniaturas/vendedor/${vendedorId}`);
        if (res.ok) setEstoque(await res.json());
    };

    // Função para marcar/desmarcar carrinhos
    const toggleMiniatura = (id) => {
        if (form.miniaturas_ids.includes(id)) {
            setForm({...form, miniaturas_ids: form.miniaturas_ids.filter(mId => mId !== id)});
        } else {
            setForm({...form, miniaturas_ids: [...form.miniaturas_ids, id]});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.miniaturas_ids.length === 0) {
            setMensagem('⚠️ Selecione pelo menos uma miniatura para compor o lote!');
            return;
        }

        setLoading(true);
        setMensagem('');

        const agora = new Date();
        const dataFim = new Date(agora.getTime() + (parseInt(form.duracao_dias) * 24 * 60 * 60 * 1000));

        const payload = {
            vendedor_id: sessao.user.id,
            titulo_leilao: form.titulo_leilao,
            miniaturas_ids: form.miniaturas_ids, // Envia a lista toda
            preco_inicial: form.preco_inicial * 100,
            descricao_leilao: form.descricao_leilao,
            data_inicio: agora.toISOString(),
            data_fim: dataFim.toISOString()
        };

        try {
            const resposta = await fetch('http://localhost:3001/api/leiloes', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (resposta.ok) {
                const {leilao} = await resposta.json();
                setMensagem('✅ Lote criado! Redirecionando...');
                setTimeout(() => router.push(`/leilao/${leilao.id}`), 1500);
            } else {
                setMensagem('❌ Erro ao criar o leilão.');
            }
        } catch (erro) {
            setMensagem('❌ Erro de conexão.');
        }
        setLoading(false);
    };

    const obterFoto = (fotos) => {
        if (!fotos) return '';
        const arr = typeof fotos === 'string' ? JSON.parse(fotos) : fotos;
        return arr[0] || '';
    };

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="max-w-5xl mx-auto mt-10">
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold text-white">Criar Evento de Leilão (Lote) 🏁</h1>
                    <Link href="/admin/garagem" className="text-gray-400 hover:text-white font-bold transition">Ver
                        Minha Garagem</Link>
                </div>

                {mensagem && <div
                    className="mb-6 p-4 rounded-lg bg-gray-800 font-bold text-center border border-gray-700">{mensagem}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">

                    {/* COLUNA ESQUERDA: Seleção de Miniaturas */}
                    <div className="flex-1 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                        <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
                            1. Selecione as Miniaturas do Lote ({form.miniaturas_ids.length} selecionadas)
                        </label>

                        {estoque.length === 0 ? (
                            <p className="text-red-400 text-sm font-bold">Garagem vazia. Cadastre carros primeiro!</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
                                {estoque.map(carro => {
                                    const selecionado = form.miniaturas_ids.includes(carro.id);
                                    return (
                                        <div
                                            key={carro.id}
                                            onClick={() => toggleMiniatura(carro.id)}
                                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all relative ${selecionado ? 'border-orange-500 bg-orange-900/20' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}
                                        >
                                            <div className="h-24 flex items-center justify-center p-2 relative">
                                                <img src={obterFoto(carro.fotos)} alt=""
                                                     className="h-full object-contain"/>
                                                {selecionado && (
                                                    <div
                                                        className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg font-bold text-sm">
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-gray-800/50">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold truncate">{carro.serie}</p>
                                                <p className="text-xs font-bold text-white truncate">{carro.titulo}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* COLUNA DIREITA: Regras do Evento */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl space-y-5">

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">2.
                                    Título do Evento</label>
                                <input type="text" placeholder="Ex: Lote JDM Velozes e Furiosos" required
                                       value={form.titulo_leilao}
                                       onChange={e => setForm({...form, titulo_leilao: e.target.value})}
                                       className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-orange-500 font-bold"/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preço
                                        (R$)</label>
                                    <input type="number" min="1" placeholder="Ex: 150" required
                                           value={form.preco_inicial}
                                           onChange={e => setForm({...form, preco_inicial: e.target.value})}
                                           className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-orange-500 font-bold"/>
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Duração</label>
                                    <select value={form.duracao_dias}
                                            onChange={e => setForm({...form, duracao_dias: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-orange-500 font-bold">
                                        <option value="1">24 Horas</option>
                                        <option value="3">3 Dias</option>
                                        <option value="5">5 Dias</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição
                                    / Condições de Venda</label>
                                <textarea rows="4" placeholder="Ex: Frete por conta do comprador..." required
                                          value={form.descricao_leilao}
                                          onChange={e => setForm({...form, descricao_leilao: e.target.value})}
                                          className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-orange-500 resize-none"></textarea>
                            </div>

                            <button type="submit" disabled={loading || form.miniaturas_ids.length === 0}
                                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-black text-lg py-4 rounded-xl transition-all transform active:scale-95 shadow-lg mt-2">
                                {loading ? 'CRIANDO...' : 'INICIAR LEILÃO LOTE'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}