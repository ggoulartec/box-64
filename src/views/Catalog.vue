<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import LotCard from '../components/auction/LotCard.vue';
import { supabase } from '../supabase.js';

const router = useRouter();

// Estado de Lotes
const lots = ref([]);
const isLoading = ref(true);
let subscription = null;

const fetchLots = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('end_time', { ascending: true });
      
    if (error) throw error;
    
    // Mapeando do BD para as props que o LotCard espera
    lots.value = data.map(l => ({
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
    console.error('Erro ao buscar lotes:', error);
  } finally {
    isLoading.value = false;
  }
};

const setupRealtime = () => {
  subscription = supabase
    .channel('public:lots')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lots' }, payload => {
      const updatedLot = payload.new;
      const index = lots.value.findIndex(l => l.id === updatedLot.id);
      if (index !== -1) {
        lots.value[index].currentBid = updatedLot.current_bid;
      }
    })
    .subscribe();
};

onMounted(() => {
  fetchLots();
  setupRealtime();
});

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
});

// Filters State
const searchQuery = ref('');
const selectedBrands = ref([]);
const selectedScales = ref([]);
const sortOrder = ref('ending_soon'); // ending_soon, price_asc, price_desc

// Filter Options
const brandOptions = ['Hot Wheels', 'MiniGT', 'Tarmac Works', 'Kaido House', 'Inno64', 'Matchbox', 'PGM'];
const scaleOptions = ['1:64', '1:43', '1:18'];

// Computed Filtered Lots
const filteredLots = computed(() => {
  let result = lots.value;

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(lot => 
      lot.model.toLowerCase().includes(q) || 
      lot.brand.toLowerCase().includes(q) ||
      lot.number.includes(q)
    );
  }

  // Brand filter
  if (selectedBrands.value.length > 0) {
    result = result.filter(lot => selectedBrands.value.includes(lot.brand));
  }

  // Scale filter
  if (selectedScales.value.length > 0) {
    result = result.filter(lot => selectedScales.value.includes(lot.scale));
  }

  // Sorting
  return result.sort((a, b) => {
    if (sortOrder.value === 'price_asc') return a.currentBid - b.currentBid;
    if (sortOrder.value === 'price_desc') return b.currentBid - a.currentBid;
    // default: ending_soon
    return new Date(a.endTime) - new Date(b.endTime);
  });
});

const handleBid = (lotId) => {
  router.push(`/lote/${lotId}`);
};

const toggleBrand = (brand) => {
  const index = selectedBrands.value.indexOf(brand);
  if (index === -1) {
    selectedBrands.value.push(brand);
  } else {
    selectedBrands.value.splice(index, 1);
  }
};

const toggleScale = (scale) => {
  const index = selectedScales.value.indexOf(scale);
  if (index === -1) {
    selectedScales.value.push(scale);
  } else {
    selectedScales.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="flex flex-col md:flex-row gap-8">
    
    <!-- Sidebar de Filtros -->
    <aside class="w-full md:w-64 flex-shrink-0 space-y-6">
      
      <!-- Busca -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-search text-zinc-500"></i> Buscar Lote
        </h3>
        <div class="relative">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Nome, marca ou número..." 
            class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          />
        </div>
      </div>

      <!-- Filtro de Marca -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-tag text-zinc-500"></i> Marca
        </h3>
        <div class="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
          <label v-for="brand in brandOptions" :key="brand" class="flex items-center gap-3 cursor-pointer group">
            <div class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                 :class="selectedBrands.includes(brand) ? 'bg-red-600 border-red-600' : 'bg-zinc-950 border-zinc-700 group-hover:border-zinc-500'">
              <i class="pi pi-check text-white text-xs" v-show="selectedBrands.includes(brand)"></i>
            </div>
            <span class="text-zinc-300 text-sm group-hover:text-white transition-colors">{{ brand }}</span>
          </label>
        </div>
      </div>

      <!-- Filtro de Escala -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-arrows-alt text-zinc-500"></i> Escala
        </h3>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="scale in scaleOptions" 
            :key="scale"
            @click="toggleScale(scale)"
            class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            :class="selectedScales.includes(scale) ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'"
          >
            {{ scale }}
          </button>
        </div>
      </div>
      
      <!-- Botão Limpar Filtros -->
      <button 
        v-if="searchQuery || selectedBrands.length > 0 || selectedScales.length > 0"
        @click="searchQuery = ''; selectedBrands = []; selectedScales = []"
        class="w-full py-2 px-4 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        Limpar Filtros
      </button>

    </aside>

    <!-- Área Principal de Lotes -->
    <div class="flex-1">
      
      <!-- Cabeçalho da Vitrine -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-white mb-1">Vitrine de Lotes</h1>
          <p class="text-zinc-400 text-sm">Mostrando {{ filteredLots.length }} {{ filteredLots.length === 1 ? 'lote encontrado' : 'lotes encontrados' }}</p>
        </div>
        
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <label class="text-sm text-zinc-400 hidden sm:block">Ordenar por:</label>
          <select 
            v-model="sortOrder"
            class="bg-zinc-900 border border-zinc-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer appearance-none flex-1 sm:flex-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25em_1.25em]"
          >
            <option value="ending_soon">Menos tempo restante</option>
            <option value="price_asc">Menor preço atual</option>
            <option value="price_desc">Maior preço atual</option>
          </select>
        </div>
      </div>

      <!-- Grid de Lotes -->
      <div v-if="filteredLots.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <LotCard 
          v-for="lot in filteredLots" 
          :key="lot.id" 
          :lot="lot" 
          @bid="handleBid"
        />
      </div>
      
      <!-- Empty State -->
      <div v-else class="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <i class="pi pi-search text-2xl text-zinc-500"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Nenhum lote encontrado</h3>
        <p class="text-zinc-400 max-w-md">Não encontramos nenhuma miniatura que corresponda aos filtros selecionados. Tente limpar os filtros ou buscar por outros termos.</p>
        <button @click="searchQuery = ''; selectedBrands = []; selectedScales = []" class="mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg transition-colors border border-zinc-700">
          Limpar todos os filtros
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for sidebar lists */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46; /* zinc-700 */
  border-radius: 10px;
}
</style>
