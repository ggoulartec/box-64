<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase.js';
import LotCard from '../components/auction/LotCard.vue';

const featuredLots = ref([]);
const isLoading = ref(true);

const fetchFeaturedLots = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('end_time', { ascending: true })
      .limit(4);
      
    if (error) throw error;
    
    featuredLots.value = data.map(l => ({
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
    console.error('Erro ao buscar lotes em destaque:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchFeaturedLots();
});
</script>

<template>
  <div class="flex flex-col gap-12 pb-12">
    <!-- Banner Principal -->
    <div class="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
      <div class="z-10 max-w-xl text-center md:text-left">
        <span class="inline-block px-4 py-1.5 bg-red-500/10 text-red-500 font-bold text-xs rounded-full uppercase tracking-[0.2em] mb-6 border border-red-500/20">Leilão da Semana</span>
        <h1 class="text-4xl md:text-6xl font-black text-white mb-6 leading-tight uppercase italic tracking-tighter">
          Garagem <span class="text-red-600">Box-64</span>
        </h1>
        <p class="text-zinc-400 mb-10 text-lg leading-relaxed">
          Sua fonte premium de miniaturas selecionadas. Edições limitadas, chases e raridades em escala 1:64 aguardando o seu lance final.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <router-link to="/vitrine" class="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/20 active:scale-95">
            Explorar Vitrine <i class="pi pi-arrow-right"></i>
          </router-link>
          <router-link to="/sobre" class="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-xl border border-zinc-700 transition-all active:scale-95 text-center">
            Nossa História
          </router-link>
        </div>
      </div>
      
      <!-- Lado Direito: Visual Premium -->
      <div class="z-10 hidden lg:block">
        <div class="w-80 h-80 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative group">
          <div class="absolute inset-0 bg-red-600/10 blur-3xl rounded-full group-hover:bg-red-600/20 transition-colors"></div>
          <i class="pi pi-box text-[120px] text-zinc-800 group-hover:text-red-900/40 transition-colors"></i>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-64 h-32 bg-zinc-800/20 backdrop-blur-md border border-zinc-700/50 rounded-2xl rotate-12 flex items-center justify-center shadow-2xl">
              <span class="text-zinc-500 font-bold italic tracking-tighter text-2xl">COLLECTORS ONLY</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Elementos decorativos de fundo -->
      <div class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-red-600/5 blur-[120px]"></div>
      <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-zinc-600/5 blur-[120px]"></div>
    </div>

    <!-- Destaques -->
    <div>
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic">
            <i class="pi pi-bolt text-red-500"></i> Lotes em Alta
          </h2>
          <p class="text-zinc-500 mt-1">Os modelos que encerram primeiro. Não perca!</p>
        </div>
        <router-link to="/vitrine" class="text-red-500 hover:text-red-400 font-bold flex items-center gap-2 transition-colors">
          Ver todos <i class="pi pi-angle-right"></i>
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="i in 4" :key="i" class="bg-zinc-900/50 border border-zinc-800 rounded-2xl aspect-[3/4] animate-pulse"></div>
      </div>

      <!-- Real Lots -->
      <div v-else-if="featuredLots.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <LotCard 
          v-for="lot in featuredLots" 
          :key="lot.id" 
          :lot="lot" 
          @bid="$router.push(`/lote/${lot.id}`)"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl">
        <p class="text-zinc-500">Nenhum lote ativo no momento. Aguarde as novidades!</p>
      </div>
    </div>

    <!-- Seção de Confiança -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
      <div class="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800 flex flex-col items-center text-center">
        <div class="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <i class="pi pi-shield text-2xl text-red-500"></i>
        </div>
        <h4 class="text-white font-bold mb-2 uppercase tracking-wider">Segurança Total</h4>
        <p class="text-zinc-500 text-sm leading-relaxed">Transações protegidas e lances auditados em tempo real com transparência absoluta.</p>
      </div>
      <div class="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800 flex flex-col items-center text-center">
        <div class="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <i class="pi pi-truck text-2xl text-red-500"></i>
        </div>
        <h4 class="text-white font-bold mb-2 uppercase tracking-wider">Envio Especial</h4>
        <p class="text-zinc-500 text-sm leading-relaxed">Embalagem reforçada contra impactos, garantindo que seu card chegue em estado de loja.</p>
      </div>
      <div class="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800 flex flex-col items-center text-center">
        <div class="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <i class="pi pi-verified text-2xl text-red-500"></i>
        </div>
        <h4 class="text-white font-bold mb-2 uppercase tracking-wider">Curadoria Box</h4>
        <p class="text-zinc-500 text-sm leading-relaxed">Cada miniatura é inspecionada fisicamente. Qualidade 100% garantida pela nossa equipe.</p>
      </div>
    </div>
  </div>
</template>
