'use client';

import {useState} from 'react';
import Link from "next/link";

export default function NovoLeilaoAdmin() {
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState('');

    // Estado para guardar tudo que for digitado
    const [form, setForm] = useState({
        titulo: '',
        descricao: '',
        estado: 'Novo/Lacrado',
        serie: 'Mainline',
        ano: 2024,
        is_th: false,
        is_sth: false,
        preco_inicial: 50, // Em Reais (o backend converte pra centavos)
        duracao_minutos: 60,
        is_anonimo: false,
        foto_url: '' // Simplificação para o teste inicial
    });

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setForm({...form, [name]: type === 'checkbox' ? checked : value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensagem('');

        // Preparando os dados (calculando datas e centavos)
        const agora = new Date();
        const dataFim = new Date(agora.getTime() + form.duracao_minutos * 60000);

        const payload = {
            ...form,
            vendedor_id: "seu_id_temporario_123", // Será trocado quando tivermos Login
            preco_inicial: form.preco_inicial * 100, // Converte R$ 50 para 5000 centavos
            data_inicio: agora.toISOString(),
            data_fim: dataFim.toISOString(),
            fotos: [form.foto_url]
        };

        try {
            const resposta = await fetch('http://localhost:3001/api/leiloes', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (resposta.ok) {
                setMensagem('✅ Leilão criado e pronto para a pista!');
                // Aqui poderíamos limpar o formulário ou redirecionar
            } else {
                setMensagem('❌ Erro ao criar o leilão.');
            }
        } catch (erro) {
            setMensagem('❌ Erro de conexão com o servidor.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="absolute top-8 left-8">
                <Link href="/" className="text-gray-400 hover:text-orange-500 font-bold flex items-center gap-2 transition-colors">
                    <span>←</span> Voltar para a Vitrine
                </Link>
            </div>
            <div className="max-w-3xl mx-auto mt-10 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-6">Criar Novo Leilão</h1>

                {mensagem && (
                    <div className="mb-6 p-4 rounded-lg bg-gray-700 font-bold text-center border border-gray-600">
                        {mensagem}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seção 1: Dados do Carro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Título da Miniatura</label>
                            <input type="text" name="titulo" required onChange={handleChange} value={form.titulo}
                                   className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                   placeholder="Ex: Datsun 510 Bluebird"/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Série / Coleção</label>
                            <select name="serie" onChange={handleChange} value={form.serie}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
                                <option>Mainline</option>
                                <option>Premium / Car Culture</option>
                                <option>Red Line Club (RLC)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Link da Foto (URL temporária)</label>
                        <input type="url" name="foto_url" onChange={handleChange} value={form.foto_url}
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none"
                               placeholder="https://imgur.com/foto_do_carrinho.png"/>
                    </div>

                    <div className="flex gap-6 border-y border-gray-700 py-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_th" onChange={handleChange} checked={form.is_th}
                                   className="w-5 h-5 accent-orange-500"/>
                            <span className="text-gray-300 font-bold">Treasure Hunt (TH)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_sth" onChange={handleChange} checked={form.is_sth}
                                   className="w-5 h-5 accent-orange-500"/>
                            <span className="text-pink-500 font-bold">Super Treasure Hunt ($TH)</span>
                        </label>
                    </div>

                    {/* Seção 2: Regras de Negócio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Preço Inicial (R$)</label>
                            <input type="number" name="preco_inicial" min="1" required onChange={handleChange}
                                   value={form.preco_inicial}
                                   className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-green-400 font-bold text-xl outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Duração (Em minutos)</label>
                            <input type="number" name="duracao_minutos" min="1" required onChange={handleChange}
                                   value={form.duracao_minutos}
                                   className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-xl outline-none"/>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold text-xl py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                        {loading ? 'Salvando...' : 'LANÇAR LEILÃO'}
                    </button>
                </form>
            </div>
        </div>
    );
}