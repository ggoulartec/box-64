<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';

const stats = ref({
  activeAuctions: 0,
  totalLots: 0,
  bidsToday: 0,
  hotLots: []
});
const isLoading = ref(true);

const fetchStats = async () => {
  isLoading.value = true;
  try {
    // 1. Leilões Ativos
    const { count: auctionCount } = await supabase
      .from('auctions')
      .select('*', { count: 'exact', head: true })
      .gt('end_time', new Date().toISOString());
    stats.value.activeAuctions = auctionCount || 0;

    // 2. Total de Lotes
    const { count: lotCount } = await supabase
      .from('lots')
      .select('*', { count: 'exact', head: true });
    stats.value.totalLots = lotCount || 0;

    // 3. Volume de Lances (Hoje)
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data: bids } = await supabase
      .from('bids')
      .select('amount')
      .gt('created_at', today.toISOString());
    
    stats.value.bidsToday = bids?.reduce((sum, b) => sum + b.amount, 0) || 0;

    // 4. Lotes mais disputados (Top 5)
    // Buscamos os lotes e contamos os lances manualmente (ou via RPC se tivéssemos)
    const { data: hotLotsData } = await supabase
      .from('lots')
      .select(`
        id, number, model, scale, current_bid,
        bids (count)
      `)
      .limit(5);
    
    // Ordenar por contagem de lances (o Supabase não ordena por count de join facilmente sem RPC)
    stats.value.hotLots = (hotLotsData || [])
      .map(l => ({
        ...l,
        bidCount: l.bids?.[0]?.count || 0
      }))
      .sort((a, b) => b.bidCount - a.bidCount);

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

onMounted(fetchStats);
</script>

<template>
  <div class="space-y-6">
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div v-for="i in 3" :key="i" class="h-32 bg-zinc-900 animate-pulse rounded-xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Card 1 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors group">
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-zinc-500 text-sm font-medium mb-1">Leilões Ativos</p>
            <h3 class="text-3xl font-bold text-white">{{ stats.activeAuctions }}</h3>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-calendar text-xl"></i>
          </div>
        </div>
        <p class="text-sm text-zinc-500 flex items-center gap-1 font-medium">
          Eventos em andamento
        </p>
      </div>

      <!-- Card 2 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors group">
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-zinc-500 text-sm font-medium mb-1">Lotes Cadastrados</p>
            <h3 class="text-3xl font-bold text-white">{{ stats.totalLots }}</h3>
          </div>
          <div class="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-car text-xl"></i>
          </div>
        </div>
        <p class="text-sm text-zinc-500">
          Total de itens na plataforma
        </p>
      </div>

      <!-- Card 3 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/50 transition-colors group">
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-zinc-500 text-sm font-medium mb-1">Volume de Lances (Hoje)</p>
            <h3 class="text-3xl font-bold text-white">{{ formatCurrency(stats.bidsToday) }}</h3>
          </div>
          <div class="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-chart-line text-xl"></i>
          </div>
        </div>
        <p class="text-sm text-green-500 flex items-center gap-1 font-medium">
          Movimentação nas últimas 24h
        </p>
      </div>

    </div>

    <!-- Tabela Resumo -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h3 class="text-white font-bold">Lotes Mais Disputados (Live)</h3>
        <router-link to="/admin/lotes" class="text-red-500 text-sm hover:underline font-bold">Ver todos</router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-zinc-400">
          <thead class="text-xs text-zinc-500 bg-zinc-950/50 uppercase font-black tracking-widest">
            <tr>
              <th class="px-6 py-4">Lote / Modelo</th>
              <th class="px-6 py-4">Escala</th>
              <th class="px-6 py-4 text-center">Lances</th>
              <th class="px-6 py-4 text-right">Valor Atual</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lot in stats.hotLots" :key="lot.id" class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
              <td class="px-6 py-4 font-medium text-white">
                <span class="text-red-500 mr-2 font-black">#{{ lot.number }}</span> {{ lot.model }}
              </td>
              <td class="px-6 py-4 text-xs font-mono">{{ lot.scale }}</td>
              <td class="px-6 py-4 text-center">
                <span class="bg-zinc-800 px-3 py-1 rounded-full text-white font-bold text-[10px] border border-zinc-700">
                  {{ lot.bidCount }}
                </span>
              </td>
              <td class="px-6 py-4 text-right text-green-400 font-black italic">
                {{ formatCurrency(lot.current_bid) }}
              </td>
            </tr>
            <tr v-if="stats.hotLots.length === 0" class="text-center">
              <td colspan="4" class="py-10 text-zinc-600 italic">Nenhuma atividade registrada hoje.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
