<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  lot: {
    type: Object,
    required: true
  }
});

const timeRemaining = ref('');
const isEnded = ref(false);
let timer = null;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const calculateTime = () => {
  const now = new Date();
  const end = new Date(props.lot.endTime);
  const diffMs = end - now;
  
  if (diffMs <= 0) {
    isEnded.value = true;
    timeRemaining.value = 'Encerrado';
    if(timer) clearInterval(timer);
    return;
  }
  
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
  const diffMins = Math.floor(((diffMs % 86400000) % 3600000) / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffDays > 0) {
    timeRemaining.value = `${diffDays}d ${diffHrs}h`;
  } else if (diffHrs > 0) {
    timeRemaining.value = `${diffHrs}h ${diffMins}m`;
  } else {
    timeRemaining.value = `${diffMins}m ${diffSecs}s`;
  }
};

onMounted(() => {
  calculateTime();
  timer = setInterval(calculateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const emit = defineEmits(['bid']);

const goToDetails = () => {
  router.push(`/lote/${props.lot.id}`);
};
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 group flex flex-col h-full shadow-lg hover:shadow-red-500/5" :class="{'opacity-75 grayscale-[0.5]': isEnded}">
    
    <!-- Imagem e Badges -->
    <div @click="goToDetails" class="aspect-square bg-zinc-800 relative flex items-center justify-center overflow-hidden cursor-pointer">
      <!-- Imagem real (se existir) -->
      <img v-if="lot.imageUrl" :src="lot.imageUrl" :alt="lot.model" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      
      <!-- Placeholder se não tiver imagem -->
      <i v-else class="pi pi-car text-zinc-600 text-5xl"></i>

      <!-- Badge de Lote -->
      <div class="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-xs font-bold text-white px-3 py-1.5 rounded-md border border-zinc-700 shadow-sm">
        Lote #{{ lot.number }}
      </div>

      <!-- Badge de Tempo -->
      <div class="absolute top-3 right-3 backdrop-blur-md text-xs font-semibold text-white px-2.5 py-1.5 rounded-md shadow-sm flex items-center gap-1.5" :class="isEnded ? 'bg-zinc-800/90 border border-zinc-700' : 'bg-red-600/90'">
        <i class="pi" :class="isEnded ? 'pi-lock' : 'pi-clock'"></i>
        {{ timeRemaining }}
      </div>
    </div>

    <!-- Informações -->
    <div class="p-5 flex flex-col flex-1">
      <div class="mb-3 flex-1">
        <p class="text-red-500 text-xs font-bold tracking-wide uppercase mb-1">{{ lot.brand }}</p>
        <h3 @click="goToDetails" class="text-white font-medium text-lg leading-tight line-clamp-2 mb-2 cursor-pointer hover:text-red-400 transition-colors" :title="lot.model">
          {{ lot.model }}
        </h3>
        <div class="flex flex-wrap gap-2 mt-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            Escala {{ lot.scale }}
          </span>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            {{ lot.condition }}
          </span>
        </div>
      </div>
      
      <div class="border-t border-zinc-800/60 pt-4 mt-auto">
        <div class="flex justify-between items-end">
          <div>
            <p class="text-zinc-500 text-xs mb-0.5 font-medium">{{ isEnded ? 'Lance Vencedor' : 'Lance Atual' }}</p>
            <p class="text-white font-bold text-xl">{{ formatCurrency(lot.currentBid) }}</p>
          </div>
          <button @click="$emit('bid', lot.id)" :disabled="isEnded" class="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors group-hover:bg-red-600 border border-zinc-700 hover:border-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:group-hover:bg-zinc-800 disabled:hover:border-zinc-700">
            <i class="pi pi-gavel text-base"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
