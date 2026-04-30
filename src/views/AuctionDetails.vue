<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase.js';
import LotCard from '../components/auction/LotCard.vue';

const route = useRoute();
const router = useRouter();
const auction = ref(null);
const lots = ref([]);
const isLoading = ref(true);

const fetchAuctionData = async () => {
  isLoading.value = true;
  try {
    const auctionId = route.params.id;

    // 1. Busca dados do Leilão
    const { data: auctionData, error: auctionError } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:profiles!auctions_seller_id_fkey (full_name)
      `)
      .eq('id', auctionId)
      .single();

    if (auctionError) throw auctionError;
    auction.value = auctionData;

    // 2. Busca lotes deste leilão
    const { data: lotsData, error: lotsError } = await supabase
      .from('lots')
      .select('*')
      .eq('auction_id', auctionId)
      .order('number', { ascending: true });

    if (lotsError) throw lotsError;
    
    lots.value = lotsData.map(l => ({
      id: l.id,
      number: l.number,
      brand: l.brand,
      model: l.model,
      scale: l.scale,
      condition: l.condition,
      currentBid: l.current_bid,
      endTime: l.end_time,
      imageUrl: l.images && l.images.length > 0 ? l.images[0] : ''
    }));

  } catch (error) {
    console.error('Erro ao buscar dados do leilão:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAuctionData();
});
</script>

<template>
  <div v-if="isLoading" class="max-w-7xl mx-auto py-20 text-center">
    <i class="pi pi-spin pi-spinner text-4xl text-red-500"></i>
  </div>

  <div v-else-if="auction" class="max-w-7xl mx-auto py-8 px-4">
    
    <!-- Voltar -->
    <router-link to="/leiloes" class="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 font-medium">
      <i class="pi pi-arrow-left text-xs"></i> Voltar para Leilões
    </router-link>

    <!-- Header do Leilão -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden shadow-2xl">
      <div class="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
        
        <div class="md:col-span-2">
          <div class="flex items-center gap-3 mb-6">
            <span class="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Evento Oficial</span>
            <span class="text-zinc-500 font-bold text-xs uppercase tracking-widest italic">Vendido por: {{ auction.seller?.full_name }}</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-6 leading-tight">
            {{ auction.title }}
          </h1>
          <p class="text-zinc-400 text-lg leading-relaxed max-w-2xl">
            {{ auction.description }}
          </p>
        </div>

        <div class="hidden md:block">
          <div class="bg-zinc-950/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
            <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Resumo do Evento</p>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-zinc-400 text-sm">Lotes:</span>
                <span class="text-white font-bold">{{ lots.length }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-zinc-400 text-sm">Status:</span>
                <span class="text-green-500 font-bold text-sm uppercase italic">Ativo</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Bg image effect -->
      <img v-if="auction.cover_image" :src="auction.cover_image" class="absolute top-0 right-0 w-1/2 h-full object-cover opacity-10 pointer-events-none grayscale" />
    </div>

    <!-- Lista de Lotes -->
    <div v-if="lots.length === 0" class="text-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl">
      <p class="text-zinc-500">Nenhum lote foi adicionado a este leilão ainda.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <LotCard 
        v-for="lot in lots" 
        :key="lot.id" 
        :lot="lot" 
        @bid="router.push(`/lote/${lot.id}`)"
      />
    </div>

  </div>
</template>
