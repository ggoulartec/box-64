<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const items = ref([]);
const isLoading = ref(true);

const fetchGarageItems = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Busca itens onde o usuário é o vencedor e o leilão já acabou
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .eq('winner_id', session.user.id)
      .eq('status', 'finished')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    items.value = data;
  } catch (error) {
    console.error('Erro ao buscar itens da garagem:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchGarageItems);
</script>

<template>
  <div class="max-w-7xl mx-auto py-12 px-4">
    
    <div class="mb-10 flex items-center gap-4">
      <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
        <i class="pi pi-box text-2xl"></i>
      </div>
      <div>
        <h1 class="text-4xl font-black italic uppercase tracking-tighter text-white">Minha Garagem</h1>
        <p class="text-zinc-500">Coleção de itens que você arrematou com sucesso.</p>
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="h-64 bg-zinc-900 animate-pulse rounded-2xl"></div>
    </div>

    <div v-else-if="items.length === 0" class="text-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl">
      <i class="pi pi-car text-4xl text-zinc-700 mb-4"></i>
      <p class="text-zinc-500">Sua garagem está vazia. <router-link to="/vitrine" class="text-red-500 font-bold hover:underline">Comece a colecionar!</router-link></p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div 
        v-for="item in items" 
        :key="item.id"
        @click="router.push(`/lote/${item.id}`)"
        class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer group shadow-xl relative"
      >
        <!-- Badge de Concluído -->
        <div class="absolute top-4 left-4 z-10">
          <span class="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Arrematado</span>
        </div>

        <div class="aspect-square bg-zinc-950 overflow-hidden">
          <img :src="item.images?.[0]" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>

        <div class="p-5">
          <p class="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{{ item.brand }}</p>
          <h3 class="text-white font-bold text-lg leading-tight mb-4 group-hover:text-red-500 transition-colors">{{ item.model }}</h3>
          
          <div class="flex justify-between items-center pt-4 border-t border-zinc-800/50">
            <div>
              <p class="text-zinc-500 text-[10px] uppercase font-bold mb-1">Preço Final</p>
              <p class="text-white font-black italic">R$ {{ item.current_bid.toLocaleString('pt-BR') }}</p>
            </div>
            <div class="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-red-600 group-hover:text-white transition-all">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
