<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const isLoading = ref(true);
const activeTab = ref('rifas');

const myRaffles = ref([]);
const myBids = ref([]);
const myPurchases = ref([]);
const myCollection = ref([]);

const showAddModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const newMini = ref({
    title: '',
    brand: '',
    model_year: '',
    scale: '1:64',
    condition: 'MOC (Na Cartela)',
    description: '',
    series: '',
    collection_number: '',
    color: '',
    rarity: 'Comum',
    image_url: '',
    images: []
});

const fetchUserData = async () => {
    isLoading.value = true;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Buscar Rifas
        const { data: raffles } = await supabase
            .from('raffle_tickets')
            .select('*, raffles(*)')
            .eq('user_id', session.user.id);
        
        const grouped = (raffles || []).reduce((acc, curr) => {
            if (!curr.raffles) return acc;
            const rid = curr.raffle_id;
            if (!acc[rid]) acc[rid] = { ...curr.raffles, tickets: [] };
            acc[rid].tickets.push(curr.ticket_number);
            return acc;
        }, {});
        myRaffles.value = Object.values(grouped);

        // 2. Buscar Lances
        const { data: bids } = await supabase
            .from('bids')
            .select('*, lots(*)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        myBids.value = bids || [];

        // 3. Buscar Compras (Lotes Arrematados)
        const { data: purchases } = await supabase
            .from('lots')
            .select('*')
            .eq('winner_id', session.user.id);
        myPurchases.value = purchases || [];

        // 4. Buscar Coleção
        const { data: collection } = await supabase
            .from('user_collection')
            .select('*')
            .order('created_at', { ascending: false });
        myCollection.value = collection || [];

    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

const openAddModal = () => {
    isEditing.value = false;
    editingId.value = null;
    newMini.value = { title: '', brand: '', model_year: '', scale: '1:64', condition: 'MOC (Na Cartela)', rarity: 'Comum', images: [] };
    showAddModal.value = true;
};

const editMiniature = (mini) => {
    isEditing.value = true;
    editingId.value = mini.id;
    newMini.value = { ...mini };
    showAddModal.value = true;
};

const deleteMiniature = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta miniatura da sua garagem?')) return;
    try {
        const { error } = await supabase.from('user_collection').delete().eq('id', id);
        if (error) throw error;
        toast.add({ severity: 'success', summary: 'Removido', detail: 'Miniatura removida com sucesso.' });
        fetchUserData();
    } catch (e) { toast.add({ severity: 'error', summary: 'Erro', detail: e.message }); }
};

const saveMiniature = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sessão expirada. Faça login novamente.');

        // 1. Limpar dados para envio (remover campos protegidos e garantir tipos corretos)
        const cleanData = {
            title: newMini.value.title,
            brand: newMini.value.brand,
            model_year: newMini.value.model_year ? parseInt(newMini.value.model_year) : null,
            scale: newMini.value.scale,
            condition: newMini.value.condition,
            description: newMini.value.description,
            series: newMini.value.series,
            collection_number: newMini.value.collection_number,
            color: newMini.value.color,
            rarity: newMini.value.rarity,
            image_url: newMini.value.image_url,
            images: newMini.value.images || []
        };

        // Garantir que a imagem principal está no array
        if (cleanData.image_url && !cleanData.images.includes(cleanData.image_url)) {
            cleanData.images.unshift(cleanData.image_url);
        }

        if (isEditing.value) {
            const { error } = await supabase
                .from('user_collection')
                .update(cleanData)
                .eq('id', editingId.value);
            
            if (error) throw error;
            toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Miniatura atualizada com sucesso!' });
        } else {
            const { error } = await supabase
                .from('user_collection')
                .insert([{ ...cleanData, user_id: session.user.id }]);
            
            if (error) throw error;
            toast.add({ severity: 'success', summary: 'Salvo', detail: 'Adicionado à sua garagem!' });
        }

        showAddModal.value = false;
        await fetchUserData(); // Recarregar lista
        
    } catch (e) {
        console.error('Erro ao salvar miniatura:', e);
        toast.add({ 
            severity: 'error', 
            summary: 'Erro ao Salvar', 
            detail: e.message || 'Verifique se você rodou os comandos SQL no Supabase.' 
        });
    }
};

onMounted(fetchUserData);
</script>

<template>
  <div class="min-h-screen bg-zinc-950 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      
      <!-- Cabeçalho do Painel -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
              <h1 class="text-4xl font-black italic uppercase text-white tracking-tighter">Meu Painel</h1>
              <p class="text-zinc-500 font-medium">Gerencie suas compras, lances e sua coleção pessoal.</p>
                 <div class="flex gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto custom-scrollbar">
              <button 
                v-for="t in ['rifas', 'leiloes', 'compras', 'colecao']" :key="t"
                @click="activeTab = t"
                :class="[
                    'px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap',
                    activeTab === t ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white'
                ]"
              >
                {{ t === 'colecao' ? 'Minha Garagem' : t }}
              </button>
          </div>
      </div>

      <div v-if="isLoading" class="flex justify-center py-20">
          <i class="pi pi-spin pi-spinner text-3xl text-red-600"></i>
      </div>

      <div v-else>
          <!-- ABA: RIFAS -->
          <div v-if="activeTab === 'rifas'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-if="myRaffles.length === 0" class="col-span-full py-20 text-center bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
                  <i class="pi pi-ticket text-4xl text-zinc-800 mb-4"></i>
                  <p class="text-zinc-500 italic">Você ainda não participa de nenhuma rifa.</p>
              </div>
              <div v-for="r in myRaffles" :key="r.id" class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-red-600/50 transition-all">
                  <div class="aspect-video relative overflow-hidden">
                      <img :src="r.cover_image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div class="absolute top-4 right-4">
                          <span :class="[
                            'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg',
                            r.status === 'active' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                          ]">
                            {{ r.status === 'active' ? 'Em Andamento' : 'Finalizada' }}
                          </span>
                      </div>
                  </div>
                  <div class="p-6">
                      <h3 class="text-white font-black italic uppercase mb-4">{{ r.title }}</h3>
                      <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <p class="text-[9px] text-zinc-500 uppercase font-black mb-2">Meus Números</p>
                          <div class="flex flex-wrap gap-1">
                              <span v-for="num in r.tickets" :key="num" class="bg-zinc-900 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-800">
                                  #{{ num }}
                              </span>
                          </div>
                      </div>
                      <router-link :to="`/rifa/${r.id}`" class="block w-full mt-6 text-center text-xs font-black uppercase text-zinc-500 hover:text-white transition-colors">
                          Ver Detalhes <i class="pi pi-arrow-right text-[10px] ml-1"></i>
                      </router-link>
                  </div>
              </div>
          </div>

          <!-- ABA: LEILÕES (Lances) -->
          <div v-if="activeTab === 'leiloes'" class="space-y-4">
              <div v-if="myBids.length === 0" class="py-20 text-center bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
                  <i class="pi pi-hammer text-4xl text-zinc-800 mb-4"></i>
                  <p class="text-zinc-500 italic">Você ainda não deu nenhum lance.</p>
              </div>
              <div v-for="b in myBids" :key="b.id" class="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                  <div class="flex items-center gap-6">
                      <div class="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-950">
                          <img :src="b.lots.images[0]" class="w-full h-full object-cover" />
                      </div>
                      <div>
                          <h3 class="text-white font-black uppercase italic">{{ b.lots.model }}</h3>
                          <p class="text-zinc-500 text-xs">Lance dado em {{ new Date(b.created_at).toLocaleDateString() }}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="text-[9px] text-zinc-500 uppercase font-black mb-1">Seu Lance</p>
                      <p class="text-2xl font-black italic text-red-500">R$ {{ b.amount.toLocaleString() }}</p>
                  </div>
              </div>
          </div>

          <!-- ABA: COMPRAS (Arrematados) -->
          <div v-if="activeTab === 'compras'" class="space-y-4">
              <div v-if="myPurchases.length === 0" class="py-20 text-center bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
                  <i class="pi pi-shopping-cart text-4xl text-zinc-800 mb-4"></i>
                  <p class="text-zinc-500 italic">Você ainda não arrematou nenhuma miniatura.</p>
              </div>
              <div v-for="p in myPurchases" :key="p.id" class="bg-zinc-900 border border-red-600/30 p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-red-600/5">
                  <div class="flex items-center gap-6">
                      <div class="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-950 p-2">
                          <img :src="p.images[0]" class="w-full h-full object-contain" />
                      </div>
                      <div>
                          <div class="flex items-center gap-2 mb-1">
                            <span class="bg-green-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Arrematado</span>
                            <span class="text-[10px] text-zinc-500 font-bold">#{{ p.number }}</span>
                          </div>
                          <h3 class="text-white font-black uppercase italic">{{ p.model }}</h3>
                          <p class="text-zinc-500 text-[10px] font-bold uppercase">{{ p.brand }} • {{ p.scale }}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="text-[9px] text-zinc-500 uppercase font-black mb-1">Valor Final</p>
                      <p class="text-2xl font-black italic text-green-500">R$ {{ p.current_bid.toLocaleString() }}</p>
                  </div>
              </div>
          </div>          </div>

          <!-- ABA: COLEÇÃO -->
          <div v-if="activeTab === 'colecao'">
              <div class="flex justify-between items-center mb-8">
                  <h2 class="text-xl font-black uppercase italic text-white">Minha Garagem <span class="text-zinc-600">({{ myCollection.length }})</span></h2>
                  <button @click="openAddModal" class="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                      <i class="pi pi-plus mr-2"></i> Adicionar Miniatura
                  </button>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div v-for="m in myCollection" :key="m.id" class="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl group relative overflow-hidden flex flex-col transition-all hover:border-red-600/50">
                      <div class="aspect-square relative mb-4">
                        <img :src="m.image_url" class="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                        <span v-if="m.rarity !== 'Comum'" class="absolute top-0 right-0 bg-red-600 text-white text-[7px] font-black uppercase px-2 py-1 rounded-bl-xl shadow-lg">{{ m.rarity }}</span>
                        
                        <!-- Overlay de Ações -->
                        <div class="w-full h-full absolute inset-0 bg-zinc-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button @click="editMiniature(m)" class="w-8 h-8 bg-white text-black rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                <i class="pi pi-pencil text-xs"></i>
                            </button>
                            <button @click="deleteMiniature(m.id)" class="w-8 h-8 bg-white text-black rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                <i class="pi pi-trash text-xs"></i>
                            </button>
                        </div>
                      </div>
                      <h4 class="text-white text-[10px] font-black uppercase truncate">{{ m.title }}</h4>
                      <p class="text-zinc-500 text-[8px] uppercase font-bold truncate">{{ m.series || m.brand }} • {{ m.scale }}</p>
                  </div>
              </div>
          </div>
      </div>

    </div>

    <!-- MODAL ADICIONAR/EDITAR MINIATURA -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
        <div class="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h3 class="text-white font-black uppercase italic">{{ isEditing ? 'Editar Miniatura' : 'Nova Miniatura' }}</h3>
                <button @click="showAddModal = false" class="text-zinc-500 hover:text-white"><i class="pi pi-times"></i></button>
            </div>
            
            <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="md:col-span-2">
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Título / Modelo</label>
                        <input v-model="newMini.title" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Marca</label>
                        <input v-model="newMini.brand" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Ano</label>
                        <input v-model="newMini.model_year" type="number" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Série / Coleção</label>
                        <input v-model="newMini.series" placeholder="Ex: HW Mainline" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Número (#)</label>
                        <input v-model="newMini.collection_number" placeholder="Ex: 124/250" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Cor</label>
                        <input v-model="newMini.color" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Escala</label>
                        <select v-model="newMini.scale" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600">
                            <option>1:64</option>
                            <option>1:43</option>
                            <option>1:24</option>
                            <option>1:18</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Condição</label>
                        <select v-model="newMini.condition" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600">
                            <option>MOC (Na Cartela)</option>
                            <option>Loose (Fora da Cartela)</option>
                            <option>Mint (Perfeito)</option>
                            <option>Custom</option>
                        </select>
                    </div>
                    <div class="md:col-span-3">
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Raridade</label>
                        <div class="flex flex-wrap gap-2">
                            <button 
                                v-for="r in ['Comum', 'Treasure Hunt', 'Super Treasure Hunt', 'Red Line Club', 'Convention Exclusive']" :key="r"
                                @click="newMini.rarity = r"
                                :class="[
                                    'px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all border',
                                    newMini.rarity === r ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                                ]"
                            >
                                {{ r }}
                            </button>
                        </div>
                    </div>
                    <div class="md:col-span-3">
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Descrição / Notas</label>
                        <textarea v-model="newMini.description" rows="3" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600 resize-none"></textarea>
                    </div>
                    <div class="md:col-span-3">
                        <label class="text-[10px] text-zinc-500 font-black uppercase mb-2 block">URL da Imagem Principal</label>
                        <input v-model="newMini.image_url" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-red-600" />
                    </div>
                </div>
            </div>

            <div class="p-6 bg-zinc-950/50 border-t border-zinc-800 flex gap-3">
                <button @click="showAddModal = false" class="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase text-zinc-500 hover:bg-zinc-800 transition-all">Cancelar</button>
                <button @click="saveMiniature" class="flex-2 bg-red-600 text-white px-12 py-4 rounded-2xl text-xs font-black uppercase shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                    {{ isEditing ? 'Salvar Alterações' : 'Salvar na Garagem' }}
                </button>
            </div>
        </div>
    </div>
  </div>
</template>
