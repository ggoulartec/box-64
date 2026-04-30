<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  currentBid: { type: Number, required: true },
  endTime: { type: [Date, String], required: true },
  minIncrement: { type: Number, default: 10 },
  bidders: { type: Array, default: () => [] }
});

const customBid = ref(0);
const emit = defineEmits(['place-bid', 'time-up']);

const timeRemaining = ref('');
const isEnded = ref(false);
let timer = null;

// Observa mudanças no lance atual (ex: lance de outro usuário via tempo real)
watch(() => props.currentBid, (newVal) => {
  customBid.value = newVal + props.minIncrement;
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const placeBid = (amount) => {
  if (isEnded.value) {
    alert('Este leilão já foi encerrado!');
    return;
  }
  if (amount > props.currentBid) {
    emit('place-bid', amount);
    customBid.value = amount + props.minIncrement;
  } else {
    alert(`O lance precisa ser maior que o valor atual.`);
  }
};

const calculateTime = () => {
  const now = new Date();
  const end = new Date(props.endTime);
  const diffMs = end - now;
  
  if (diffMs <= 0) {
    isEnded.value = true;
    timeRemaining.value = 'Leilão Encerrado';
    if(timer) clearInterval(timer);
    emit('time-up');
    return;
  }
  
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
  const diffMins = Math.floor(((diffMs % 86400000) % 3600000) / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffDays > 0) {
    timeRemaining.value = `${diffDays}d ${diffHrs}h ${diffMins}m`;
  } else {
    timeRemaining.value = `${diffHrs}h ${diffMins}m ${diffSecs}s`;
  }
};

onMounted(() => {
  customBid.value = props.currentBid + props.minIncrement;
  calculateTime();
  timer = setInterval(calculateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
    
    <!-- Tempo Restante Banner -->
    <div class="bg-red-600/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
          <i class="pi pi-clock text-red-500 text-xl animate-pulse"></i>
        </div>
        <div>
          <p class="text-red-500 font-semibold text-sm uppercase tracking-wider">Encerra em</p>
          <p class="text-white font-bold text-2xl tracking-tight">{{ timeRemaining }}</p>
        </div>
      </div>
    </div>

    <!-- Valor Atual -->
    <div>
      <p class="text-zinc-400 text-sm font-medium mb-1">Lance Atual</p>
      <div class="flex items-end gap-3">
        <p class="text-4xl font-bold text-white">{{ formatCurrency(currentBid) }}</p>
        <p class="text-zinc-500 text-sm mb-1.5">(Mínimo próximo: {{ formatCurrency(currentBid + minIncrement) }})</p>
      </div>
    </div>

    <!-- Ações de Lance -->
    <div class="space-y-4 pt-4 border-t border-zinc-800" :class="{'opacity-50 pointer-events-none': isEnded}">
      
      <!-- Lances Rápidos -->
      <div class="grid grid-cols-2 gap-3">
        <button @click="placeBid(currentBid + minIncrement)" :disabled="isEnded" class="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2">
          + {{ formatCurrency(minIncrement) }}
        </button>
        <button @click="placeBid(currentBid + 50)" :disabled="isEnded" class="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2">
          + R$ 50,00
        </button>
      </div>

      <!-- Lance Personalizado -->
      <div class="flex gap-3">
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">R$</span>
          <input 
            type="number" 
            v-model="customBid"
            :disabled="isEnded"
            class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors disabled:cursor-not-allowed"
          />
        </div>
        <button @click="placeBid(customBid)" :disabled="isEnded" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-red-600/20 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:shadow-none">
          Dar Lance
        </button>
      </div>
    </div>

    <!-- Histórico de Lances -->
    <div class="pt-4 border-t border-zinc-800">
      <h4 class="text-zinc-300 font-medium flex items-center gap-2 mb-4">
        <i class="pi pi-history text-zinc-500"></i> Últimos Lances
      </h4>
      <div class="space-y-3">
        <div v-for="(bidder, index) in bidders" :key="index" class="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
              {{ bidder.user.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-medium text-white">{{ bidder.user }}</p>
              <p class="text-xs text-zinc-500">{{ bidder.time }}</p>
            </div>
          </div>
          <p class="text-white font-bold" :class="{'text-green-400': index === 0}">
            {{ formatCurrency(bidder.amount) }}
          </p>
        </div>
        <div v-if="bidders.length === 0" class="text-center py-4 text-zinc-500 text-sm">
          Seja o primeiro a dar um lance!
        </div>
      </div>
    </div>

  </div>
</template>
