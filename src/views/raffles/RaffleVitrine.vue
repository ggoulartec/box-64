<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const raffles = ref([]);
const isLoading = ref(true);

const fetchRaffles = async () => {
  isLoading.value = true;
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Buscar ativas OU finalizadas recentemente
    const { data, error } = await supabase
      .from('raffles')
      .select('*, raffle_tickets(count)')
      .or(`status.eq.active,and(status.eq.finished,finished_at.gt.${oneDayAgo})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    raffles.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchRaffles);
</script>

<template>
  <div class="max-w-7xl mx-auto py-12 px-4">
    
    <div class="mb-12 text-center">
      <h1 class="text-6xl font-black italic uppercase tracking-tighter text-white mb-4">Ações Premiadas</h1>
      <p class="text-zinc-500 text-lg">Sua chance de levar miniaturas raras por um valor simbólico.</p>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="i in 6" :key="i" class="h-96 bg-zinc-900 animate-pulse rounded-3xl"></div>
    </div>

    <div v-else-if="raffles.length === 0" class="text-center py-20">
      <i class="pi pi-ticket text-6xl text-zinc-800 mb-6"></i>
      <h3 class="text-white text-2xl font-bold mb-2">Nenhuma rifa ativa no momento</h3>
      <p class="text-zinc-500">Fique de olho em nossas redes para novos sorteios!</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div 
        v-for="r in raffles" 
        :key="r.id"
        @click="router.push(`/rifa/${r.id}`)"
        class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-500/50 transition-all cursor-pointer group shadow-2xl flex flex-col h-full"
      >
        <div class="aspect-video relative overflow-hidden">
          <img :src="r.cover_image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
          
          <div class="absolute bottom-4 left-4">
            <span v-if="r.status === 'finished'" class="bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Finalizada</span>
            <span v-else class="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Em Aberto</span>
          </div>
          
          <div class="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur px-3 py-2 rounded-2xl border border-zinc-800">
             <p class="text-[8px] text-zinc-500 uppercase font-black leading-none">Cota</p>
             <p class="text-white font-black italic">R$ {{ r.ticket_price.toLocaleString('pt-BR') }}</p>
          </div>
        </div>

        <div class="p-6 flex-1 flex flex-col">
          <h3 class="text-2xl font-black text-white mb-2 leading-tight group-hover:text-red-500 transition-colors">{{ r.title }}</h3>
          <p class="text-zinc-500 text-sm line-clamp-2 mb-6">{{ r.description }}</p>
          
          <div class="mt-auto space-y-4">
            <!-- Barra de Progresso -->
            <div>
              <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <span>Progresso</span>
                <span class="text-white">{{ (((r.raffle_tickets?.[0]?.count || 0) / r.total_tickets) * 100).toFixed(1) }}%</span>
              </div>
              <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full bg-red-600 transition-all" :style="{width: (((r.raffle_tickets?.[0]?.count || 0) / r.total_tickets) * 100) + '%'}"></div>
              </div>
            </div>

            <button class="w-full cursor-pointer bg-zinc-800 group-hover:bg-red-600 text-white font-black uppercase italic py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
              {{ r.status === 'finished' ? 'Ver Resultado' : 'Escolher Cotas' }} <i class="pi pi-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
