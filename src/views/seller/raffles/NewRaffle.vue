<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../../../supabase.js';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const isEditMode = computed(() => !!route.params.id);
const raffleId = route.params.id;

const isLoading = ref(false);
const raffle = ref({
  title: '',
  description: '',
  cover_image: '',
  images: [],
  ticket_price: 1,
  total_tickets: 1000,
  status: 'active',
  discounts: [], // [{qty: 10, price: 90}]
  winning_numbers: [] // [{number: 123, prize: 'R$ 100'}]
});

// Auxiliares para formulário
const newDiscount = ref({ qty: 10, price: 0 });
const newWinningNumber = ref({ number: 0, prize: '' });

onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', raffleId)
        .single();
        
      if (error) throw error;
      
      // Garantir que campos JSONB nunca sejam nulos para evitar erros de .push()
      raffle.value = {
        ...data,
        winning_numbers: data.winning_numbers || [],
        discounts: data.discounts || []
      };
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar rifa' });
    } finally {
      isLoading.value = false;
    }
  }
});

const addDiscount = () => {
  if (newDiscount.value.qty > 0 && newDiscount.value.price > 0) {
    raffle.value.discounts.push({ ...newDiscount.value });
    newDiscount.value = { qty: 0, price: 0 };
  }
};

const addWinningNumber = () => {
  if (newWinningNumber.value.number > 0 && newWinningNumber.value.prize) {
    raffle.value.winning_numbers.push({ ...newWinningNumber.value });
    newWinningNumber.value = { number: 0, prize: '' };
  }
};

const handleSaveRaffle = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const dbPayload = {
      ...raffle.value,
      seller_id: session.user.id
    };

    const { error } = isEditMode.value 
      ? await supabase.from('raffles').update(dbPayload).eq('id', raffleId)
      : await supabase.from('raffles').insert([dbPayload]);

    if (error) throw error;

    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Rifa salva com sucesso!' });
    router.push('/vendedor/rifas');
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: error.message });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-10 px-4">
    <div class="mb-8 flex items-center gap-4">
      <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
        <i class="pi pi-ticket text-2xl"></i>
      </div>
      <div>
        <h1 class="text-4xl font-black italic uppercase tracking-tighter text-white">
          {{ isEditMode ? 'Editar Rifa' : 'Nova Rifa' }}
        </h1>
        <p class="text-zinc-500">Configure sua campanha de sorteio e cotas premiadas.</p>
      </div>
    </div>

    <form @submit.prevent="handleSaveRaffle" class="space-y-8">
      
      <!-- Informações Básicas -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <h3 class="text-white font-bold uppercase tracking-widest text-sm border-b border-zinc-800 pb-4">Informações Básicas</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Título da Rifa</label>
            <input v-model="raffle.title" required type="text" placeholder="Ex: Fusca 1970 Impecável" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Imagem de Capa (URL)</label>
            <input v-model="raffle.cover_image" required type="url" placeholder="https://..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-all" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição Detalhada</label>
          <textarea v-model="raffle.description" rows="4" placeholder="Regras, prêmios, data do sorteio..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-all"></textarea>
        </div>
      </div>

      <!-- Valores e Cotas -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <h3 class="text-white font-bold uppercase tracking-widest text-sm border-b border-zinc-800 pb-4">Configuração de Vendas</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Preço por Cota (R$)</label>
            <input v-model.number="raffle.ticket_price" required type="number" step="0.01" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Total de Cotas</label>
            <input v-model.number="raffle.total_tickets" required type="number" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-all" />
          </div>
        </div>

        <!-- Combos de Desconto -->
        <div class="pt-4">
          <label class="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 block mb-4">Combos de Desconto (Ex: 10 cotas por R$ 90)</label>
          <div class="flex gap-4 mb-4">
            <input v-model.number="newDiscount.qty" type="number" placeholder="Qtd Cotas" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-white text-sm" />
            <input v-model.number="newDiscount.price" type="number" step="0.01" placeholder="Preço Total" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-white text-sm" />
            <button type="button" @click="addDiscount" class="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-xl transition-colors">
              <i class="pi pi-plus"></i>
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="(d, idx) in raffle.discounts" :key="idx" class="bg-red-600/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
              {{ d.qty }} cotas por R$ {{ d.price }}
              <i class="pi pi-times cursor-pointer hover:text-white" @click="raffle.discounts.splice(idx, 1)"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Cotas Premiadas -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <h3 class="text-white font-bold uppercase tracking-widest text-sm border-b border-zinc-800 pb-4">Cotas Premiadas (Instantâneas)</h3>
        
        <div class="flex gap-4 mb-4">
          <input v-model.number="newWinningNumber.number" type="number" placeholder="Nº da Cota" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-white text-sm" />
          <input v-model="newWinningNumber.prize" type="text" placeholder="Prêmio (Ex: R$ 500 via PIX)" class="flex-[2] bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-white text-sm" />
          <button type="button" @click="addWinningNumber" class="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-xl transition-colors">
            <i class="pi pi-plus"></i>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="(w, idx) in raffle.winning_numbers" :key="idx" class="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center group">
            <div>
              <p class="text-red-500 font-black text-lg leading-none">#{{ w.number }}</p>
              <p class="text-zinc-500 text-xs">{{ w.prize }}</p>
            </div>
            <button type="button" @click="raffle.winning_numbers.splice(idx, 1)" class="text-zinc-700 hover:text-red-500 transition-colors">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4 pt-6">
        <button type="button" @click="router.back()" class="px-8 py-4 text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors">Cancelar</button>
        <button 
          type="submit" 
          :disabled="isLoading"
          class="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase italic py-4 rounded-2xl shadow-xl shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
          {{ isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Publicar Rifa') }}
        </button>
      </div>

    </form>
  </div>
</template>
