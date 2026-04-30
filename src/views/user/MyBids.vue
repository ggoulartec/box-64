<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const myBids = ref([]);
const isLoading = ref(true);

const fetchMyBids = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Busca os lotes onde o usuário deu lance
    const { data: bidsData, error: bidsError } = await supabase
      .from('bids')
      .select(`
        lot_id,
        amount,
        lots (*)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (bidsError) throw bidsError;

    // 2. Agrupa por lote (pega apenas o lance mais recente do usuário para cada lote)
    const grouped = {};
    bidsData.forEach(bid => {
      if (!grouped[bid.lot_id]) {
        grouped[bid.lot_id] = {
          lot: bid.lots,
          myLastBid: bid.amount,
          isWinning: bid.amount === bid.lots.current_bid
        };
      }
    });

    myBids.value = Object.values(grouped);
  } catch (error) {
    console.error('Erro ao buscar meus lances:', error);
  } finally {
    isLoading.value = false;
  }
};

const getStatusColor = (item) => {
  if (item.isWinning) return 'text-green-500 bg-green-500/10 border-green-500/20';
  return 'text-red-500 bg-red-500/10 border-red-500/20';
};

onMounted(fetchMyBids);
</script>

<template>
  <div class="max-w-7xl mx-auto py-12 px-4">
    
    <div class="mb-10">
      <h1 class="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">Meus Lances</h1>
      <p class="text-zinc-500">Acompanhe suas disputas e garanta suas miniaturas favoritas.</p>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-48 bg-zinc-900 animate-pulse rounded-2xl"></div>
    </div>

    <div v-else-if="myBids.length === 0" class="text-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl">
      <i class="pi pi-info-circle text-4xl text-zinc-700 mb-4"></i>
      <p class="text-zinc-500">Você ainda não deu nenhum lance. <router-link to="/vitrine" class="text-red-500 font-bold hover:underline">Ir para a vitrine</router-link></p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="item in myBids" 
        :key="item.lot.id"
        @click="router.push(`/lote/${item.lot.id}`)"
        class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer group shadow-xl"
      >
        <div class="aspect-video relative overflow-hidden bg-zinc-950">
          <img :src="item.lot.images?.[0]" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
          
          <div class="absolute top-4 right-4">
            <span :class="getStatusColor(item)" class="text-[10px] font-black uppercase px-3 py-1.5 rounded-full border shadow-lg">
              {{ item.isWinning ? 'Ganhando' : 'Superado' }}
            </span>
          </div>
        </div>

        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{{ item.lot.brand }}</p>
              <h3 class="text-white font-bold text-lg leading-tight group-hover:text-red-500 transition-colors">{{ item.lot.model }}</h3>
            </div>
            <p class="text-zinc-600 font-mono text-xs">#{{ item.lot.number }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
            <div>
              <p class="text-zinc-500 text-[10px] uppercase font-bold mb-1">Seu Lance</p>
              <p class="text-white font-bold italic">R$ {{ item.myLastBid.toLocaleString('pt-BR') }}</p>
            </div>
            <div>
              <p class="text-zinc-500 text-[10px] uppercase font-bold mb-1">Lance Atual</p>
              <p :class="item.isWinning ? 'text-green-500' : 'text-red-500'" class="font-bold italic">
                R$ {{ item.lot.current_bid.toLocaleString('pt-BR') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
