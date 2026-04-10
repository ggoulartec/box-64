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

    // Estado do carro selecionado para mostrar o preview
    const [carroSelecionado, setCarroSelecionado] = useState(null);

    // O formulário agora é só sobre as REGRAS do leilão
    const [form, setForm] = useState({
        miniatura_id: '',
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
        try {
            const res = await fetch(`http://localhost:3001/api/miniaturas/vendedor/${vendedorId}`);
            if (res.ok) {
                const dados = await res.json();
                setEstoque(dados);
            }
        } catch (error) {
            console.error("Erro ao buscar estoque:", error);
        }
    };

    // Quando o usuário escolhe um carro no Dropdown, atualizamos a foto de preview
    const handleSelecaoCarro = (e) => {
        const id = e.target.value;
        setForm({...form, miniatura_id: id});
        const carro = estoque.find(c => c.id === id);
        setCarroSelecionado(carro || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.miniatura_id) {
            setMensagem('⚠️ Selecione uma miniatura da sua garagem primeiro!');
            return;
        }

        setLoading(true);
        setMensagem('');

        // Lógica de tempo inteligente (calcula a data de fim baseado nos dias escolhidos)
        const agora = new Date();
        const dataFim = new Date(agora.getTime() + (parseInt(form.duracao_dias) * 24 * 60 * 60 * 1000));

        const payload = {
            vendedor_id: sessao.user.id,
            miniatura_id: form.miniatura_id,
            preco_inicial: form.preco_inicial * 100, // Converte para centavos
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
                setMensagem('✅ Leilão iniciado! Preparando a pista...');
                setTimeout(() => router.push(`/leilao/${leilao.id}`), 1500);
            } else {
                setMensagem('❌ Erro ao criar o leilão.');
            }
        } catch (erro) {
            setMensagem('❌ Erro de conexão.');
        }
        setLoading(false);
    };

    // Tratamento rápido para a foto de preview
    const obterFotoPreview = (fotos) => {
        if (!fotos) return '';
        const arr = typeof fotos === 'string' ? JSON.parse(fotos) : fotos;
        return arr[0] || '';
    };

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto mt-10">
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold text-white">Lançar Novo Leilão 🏁</h1>
                    <Link href="/admin/garagem" className="text-gray-400 hover:text-white font-bold transition">
                        Ver Minha Garagem
                    </Link>
                </div>

                {mensagem && (
                    <div className="mb-6 p-4 rounded-lg bg-gray-800 font-bold text-center border border-gray-700">
                        {mensagem}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">

                    {/* COLUNA ESQUERDA: Formulário */}
                    <div className="flex-1 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* 1. Escolha a Miniatura */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">1.
                                    Escolha o Carro da Garagem</label>
                                <select
                                    value={form.miniatura_id}
                                    onChange={handleSelecaoCarro}
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 text-lg font-semibold"
                                >
                                    <option value="" disabled>Selecione uma miniatura...</option>
                                    {estoque.map(carro => (
                                        <option key={carro.id} value={carro.id}>
                                            {carro.titulo} ({carro.serie})
                                        </option>
                                    ))}
                                </select>
                                {estoque.length === 0 && (
                                    <p className="text-red-400 text-xs mt-2 font-bold">Você não tem carros na garagem.
                                        Cadastre primeiro!</p>
                                )}
                            </div>

                            {/* 2. Regras Financeiras */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preço
                                        Inicial (R$)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Ex: 50"
                                        required
                                        value={form.preco_inicial}
                                        onChange={e => setForm({...form, preco_inicial: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 text-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Duração
                                        do Leilão</label>
                                    <select
                                        value={form.duracao_dias}
                                        onChange={e => setForm({...form, duracao_dias: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 text-lg font-bold"
                                    >
                                        <option value="1">24 Horas</option>
                                        <option value="3">3 Dias</option>
                                        <option value="5">5 Dias</option>
                                        <option value="7">1 Semana</option>
                                    </select>
                                </div>
                            </div>

                            {/* 3. Descrição do Evento */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Regras
                                    / Condições de Venda</label>
                                <textarea
                                    rows="3"
                                    placeholder="Ex: Frete grátis via transportadora. Pagamento em até 24h após o fim."
                                    value={form.descricao_leilao}
                                    onChange={e => setForm({...form, descricao_leilao: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || estoque.length === 0}
                                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-black text-xl py-5 rounded-xl transition-all transform active:scale-95 shadow-[0_0_15px_rgba(234,88,12,0.4)] mt-4"
                            >
                                {loading ? 'CRIANDO SALA...' : 'INICIAR LEILÃO AO VIVO'}
                            </button>
                        </form>
                    </div>

                    {/* COLUNA DIREITA: Preview Visual */}
                    <div className="w-full md:w-1/3">
                        <div className="sticky top-8">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview da
                                Vitrine</p>

                            {carroSelecionado ? (
                                <div
                                    className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                                    <div className="h-48 bg-gray-900 p-4 relative flex items-center justify-center">
                                        <img src={obterFotoPreview(carroSelecionado.fotos)} alt="Preview"
                                             className="w-full h-full object-contain"/>
                                        {carroSelecionado.is_sth && <span
                                            className="absolute top-3 right-3 bg-pink-600 text-[10px] font-black px-2 py-1 rounded shadow-md">$TH</span>}
                                    </div>
                                    <div className="p-5">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{carroSelecionado.serie}</p>
                                        <h3 className="font-bold text-lg text-white leading-tight mb-4">{carroSelecionado.titulo}</h3>
                                        <div className="pt-4 border-t border-gray-700">
                                            <p className="text-xs text-gray-500 font-bold">Estado: <span
                                                className="text-gray-300">{carroSelecionado.estado}</span></p>
                                            <p className="text-xs text-gray-500 font-bold mt-1">Lançamento: <span
                                                className="text-gray-300">{carroSelecionado.ano_lancamento}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed h-64 flex items-center justify-center text-gray-500 font-bold text-sm text-center p-6">
                                    Selecione um carro na garagem para ver o preview.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}