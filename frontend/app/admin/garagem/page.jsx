'use client';

import {useState, useEffect} from 'react';
import {supabase} from '../../../lib/supabaseClient';
import Link from 'next/link';

export default function GaragemVendedor() {
    const [miniaturas, setMiniaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessao, setSessao] = useState(null);

    // Estado para o formulário de Cadastro/Edição atualizado com todos os campos do BD
    const [showModal, setShowModal] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState({
        titulo: '',
        serie: 'Mainline',
        fotos: [''],
        is_th: false,
        is_sth: false,
        descricao: '',
        estado: 'Novo/Lacrado',
        ano_lancamento: new Date().getFullYear()
    });

    useEffect(() => {
        const inicializar = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (session) {
                setSessao(session);
                buscarMiniaturas(session.user.id);
            }
        };
        inicializar();
    }, []);

    const buscarMiniaturas = async (vendedorId) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/miniaturas/vendedor/${vendedorId}`);
            if (res.ok) setMiniaturas(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editandoId ? `http://localhost:3001/api/miniaturas/${editandoId}` : `http://localhost:3001/api/miniaturas`;
        const method = editandoId ? 'PUT' : 'POST';

        const payload = {...form, vendedor_id: sessao.user.id};

        const res = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setShowModal(false);
            setEditandoId(null);
            // Limpa o formulário após salvar
            setForm({
                titulo: '', serie: 'Mainline', fotos: [''], is_th: false, is_sth: false,
                descricao: '', estado: 'Novo/Lacrado', ano_lancamento: new Date().getFullYear()
            });
            buscarMiniaturas(sessao.user.id);
        }
    };

    const eliminarMiniatura = async (id) => {
        if (!confirm("Tem certeza que deseja remover esta miniatura do estoque?")) return;
        const res = await fetch(`http://localhost:3001/api/miniaturas/${id}`, {method: 'DELETE'});
        if (res.ok) buscarMiniaturas(sessao.user.id);
    };

    const abrirEdicao = (min) => {
        setEditandoId(min.id);

        // Garante que a foto seja um array, mesmo se o BD retornar como string JSON
        let fotosTratadas = [''];
        if (min.fotos) {
            fotosTratadas = typeof min.fotos === 'string' ? JSON.parse(min.fotos) : min.fotos;
        }

        setForm({
            titulo: min.titulo || '',
            serie: min.serie || 'Mainline',
            fotos: fotosTratadas,
            is_th: min.is_th || false,
            is_sth: min.is_sth || false,
            descricao: min.descricao || '',
            estado: min.estado || 'Novo/Lacrado',
            ano_lancamento: min.ano_lancamento || new Date().getFullYear()
        });
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Minha Garagem 🏎️</h1>
                    <button
                        onClick={() => {
                            setEditandoId(null);
                            // Reseta o formulário ao abrir para criar novo
                            setForm({
                                titulo: '', serie: 'Mainline', fotos: [''], is_th: false, is_sth: false,
                                descricao: '', estado: 'Novo/Lacrado', ano_lancamento: new Date().getFullYear()
                            });
                            setShowModal(true);
                        }}
                        className="bg-orange-600 hover:bg-orange-50 text-white hover:text-orange-600 font-bold py-2 px-6 rounded-lg transition"
                    >
                        + Nova Miniatura
                    </button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 py-20 animate-pulse">Limpando as prateleiras...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {miniaturas.map(min => {
                            // Tratamento de segurança para exibição da foto
                            let primeiraFoto = '';
                            if (min.fotos) {
                                const arrFotos = typeof min.fotos === 'string' ? JSON.parse(min.fotos) : min.fotos;
                                primeiraFoto = arrFotos[0];
                            }

                            return (
                                <div key={min.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col shadow-lg">
                                    <div className="h-48 bg-gray-900 flex items-center justify-center relative p-4">
                                        {primeiraFoto ? (
                                            <img src={primeiraFoto} alt={min.titulo} className="w-full h-full object-contain drop-shadow-xl"/>
                                        ) : (
                                            <span className="text-gray-600 font-bold text-sm">Sem Foto</span>
                                        )}
                                        {min.is_sth && <span className="absolute top-3 right-3 bg-pink-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md">$TH</span>}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{min.serie}</p>
                                            <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">{min.ano_lancamento}</span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1 leading-tight">{min.titulo}</h3>
                                        <p className="text-xs text-orange-400 mb-4">{min.estado}</p>

                                        <div className="flex gap-2 mt-auto">
                                            <button onClick={() => abrirEdicao(min)} className="flex-1 bg-gray-700 hover:bg-gray-600 transition-colors text-xs py-2.5 rounded font-bold">EDITAR</button>
                                            <button onClick={() => eliminarMiniatura(min.id)} className="flex-1 bg-red-900/30 hover:bg-red-900/50 transition-colors text-red-400 text-xs py-2.5 rounded font-bold">EXCLUIR</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Cadastro/Edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-2xl rounded-2xl p-8 shadow-2xl my-8">
                        <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4">{editandoId ? '✏️ Editar Miniatura' : '📦 Cadastrar na Garagem'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Título e URL */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Título da Miniatura</label>
                                    <input type="text" placeholder="Ex: '18 Honda Civic Type-R" required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500 transition-colors"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Link da Foto (URL)</label>
                                    <input type="url" placeholder="https://..." required value={form.fotos[0]} onChange={e => setForm({...form, fotos: [e.target.value]})} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500 transition-colors"/>
                                </div>
                            </div>

                            {/* Série, Estado e Ano */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Série</label>
                                    <select value={form.serie} onChange={e => setForm({...form, serie: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500">
                                        <option value="Mainline">Mainline</option>
                                        <option value="Premium">Premium</option>
                                        <option value="RLC">RLC</option>
                                        <option value="Zamac">Zamac</option>
                                        <option value="Red Edition">Red Edition</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estado</label>
                                    <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500">
                                        <option value="Novo/Lacrado">Novo/Lacrado</option>
                                        <option value="Loose (Perfeito)">Loose (Perfeito)</option>
                                        <option value="Loose (Marcas de uso)">Loose (Marcas de uso)</option>
                                        <option value="Customizado">Customizado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ano</label>
                                    <input type="number" required value={form.ano_lancamento} onChange={e => setForm({...form, ano_lancamento: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500"/>
                                </div>
                            </div>

                            {/* Checkboxes TH/STH */}
                            <div className="flex gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                    <input type="checkbox" checked={form.is_th} onChange={e => setForm({...form, is_th: e.target.checked})} className="w-5 h-5 accent-orange-500" />
                                    <span className="text-sm font-bold text-gray-300">Treasure Hunt (TH)</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                    <input type="checkbox" checked={form.is_sth} onChange={e => setForm({...form, is_sth: e.target.checked})} className="w-5 h-5 accent-pink-600" />
                                    <span className="text-sm font-bold text-pink-500">Super Treasure Hunt ($TH)</span>
                                </label>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Descrição / Detalhes</label>
                                <textarea rows="3" placeholder="Detalhes sobre a cartela, pintura, roda de borracha..." value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg outline-none focus:border-orange-500 resize-none"></textarea>
                            </div>

                            {/* Botões */}
                            <div className="flex gap-3 pt-4 border-t border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-700 rounded-xl transition">CANCELAR</button>
                                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-500 py-3.5 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(234,88,12,0.3)] transition transform active:scale-95">SALVAR NA GARAGEM</button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}