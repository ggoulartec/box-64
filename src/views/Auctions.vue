<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const auctions = ref([]);
const isLoading = ref(true);

const fetchAuctions = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:profiles!auctions_seller_id_fkey (full_name)
      `)
      .order('end_time', { ascending: true });

    if (error) throw error;
    auctions.value = data;
  } catch (error) {
    console.error('Erro ao buscar leilões:', error);
  } finally {
    isLoading.value = false;
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
};

onMounted(() => {
  fetchAuctions();
});
</script>

<template>
  <div class="max-w-7xl mx-auto py-10 px-4">
    
    <!-- Header -->
    <div class="mb-12">
      <h1 class="text-4xl font-black text-white italic uppercase tracking-tighter mb-3">
        Eventos de <span class="text-red-600">Leilão</span>
      </h1>
      <p class="text-zinc-400 max-w-2xl">
        Descubra coleções exclusivas agrupadas por temas e vendedores. Cada evento é uma oportunidade única de completar sua garagem.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div v-for="i in 2" :key="i" class="bg-zinc-900 border border-zinc-800 rounded-3xl h-64 animate-pulse"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="auctions.length === 0" class="text-center py-24 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
      <i class="pi pi-calendar-times text-5xl text-zinc-700 mb-4"></i>
      <h2 class="text-xl font-bold text-white mb-2">Nenhum evento agendado</h2>
      <p class="text-zinc-400">Fique de olho! Novos leilões são criados todos os dias pelos nossos vendedores.</p>
    </div>

    <!-- Auction Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div v-for="auction in auctions" :key="auction.id" 
           class="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-500/50 transition-all duration-500 shadow-2xl flex flex-col sm:flex-row">
        
        <!-- Capa do Leilão -->
        <div class="sm:w-2/5 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-zinc-800">
          <img v-if="auction.cover_image" :src="auction.cover_image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <i class="pi pi-image text-4xl text-zinc-700"></i>
          </div>
          <div class="absolute top-4 left-4">
            <span class="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Live</span>
          </div>
        </div>

        <!-- Info -->
        <div class="p-8 flex-1 flex flex-col">
          <div class="mb-4">
            <h3 class="text-2xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">{{ auction.title }}</h3>
            <div class="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
              <i class="pi pi-user text-[10px]"></i>
              Vendido por: <span class="text-zinc-300">{{ auction.seller?.full_name || 'Vendedor Box-64' }}</span>
            </div>
          </div>

          <p class="text-zinc-400 text-sm line-clamp-2 mb-6 flex-1">
            {{ auction.description }}
          </p>

          <div class="pt-6 border-t border-zinc-800 flex items-center justify-between mt-auto">
            <div class="text-sm">
              <p class="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">Encerra em:</p>
              <p class="text-white font-bold italic">{{ formatTime(auction.end_time) }}</p>
            </div>
            <router-link :to="`/leilao/${auction.id}`" class="bg-zinc-800 hover:bg-red-600 text-white p-3 rounded-xl transition-all active:scale-90">
              <i class="pi pi-arrow-right"></i>
            </router-link>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
