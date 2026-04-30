<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';

const stats = ref({
  totalAuctions: 0,
  totalLots: 0,
  totalBids: 0
});

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Busca contagem de leilões do vendedor
  const { count: auctionsCount } = await supabase
    .from('auctions')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', session.user.id);

  // Busca contagem de lotes do vendedor
  const { count: lotsCount } = await supabase
    .from('lots')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', session.user.id);

  stats.value.totalAuctions = auctionsCount || 0;
  stats.value.totalLots = lotsCount || 0;
});
</script>

<template>
  <div class="space-y-10 gap-6 flex flex-col">
    
    <!-- Welcome Header -->
    <div class="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
      <div class="relative z-10">
        <h1 class="text-3xl font-black italic uppercase tracking-tighter mb-2">Boas-vindas ao seu Painel!</h1>
        <p class="text-red-100 opacity-80">Gerencie seus leilões, acompanhe os lances e expanda sua garagem de vendas.</p>
      </div>
      <i class="pi pi-box absolute -right-10 -bottom-10 text-[200px] opacity-10 rotate-12"></i>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
        <div class="flex justify-between items-start mb-4">
          <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest">Meus Leilões</p>
          <div class="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
            <i class="pi pi-calendar"></i>
          </div>
        </div>
        <h3 class="text-4xl font-black text-white italic tracking-tighter">{{ stats.totalAuctions }}</h3>
        <p class="text-zinc-600 text-xs mt-2 italic">Eventos criados por você</p>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
        <div class="flex justify-between items-start mb-4">
          <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest">Lotes Totais</p>
          <div class="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
            <i class="pi pi-car"></i>
          </div>
        </div>
        <h3 class="text-4xl font-black text-white italic tracking-tighter">{{ stats.totalLots }}</h3>
        <p class="text-zinc-600 text-xs mt-2 italic">Carrinhos cadastrados no total</p>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl border-dashed border-zinc-700 flex flex-col items-center justify-center text-center opacity-50">
        <i class="pi pi-chart-line text-2xl text-zinc-600 mb-3"></i>
        <p class="text-zinc-600 text-xs font-bold uppercase tracking-widest">Saldo e Vendas</p>
        <p class="text-zinc-700 text-[10px] italic">Em breve no MVP 2</p>
      </div>

    </div>

    <!-- Quick Actions -->
    <div class="flex gap-4">
      <router-link to="/vendedor/leiloes/novo" class="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 p-6 rounded-2xl flex items-center gap-4 transition-all group flex-1">
        <div class="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
          <i class="pi pi-plus"></i>
        </div>
        <div>
          <h4 class="text-white font-bold">Novo Leilão</h4>
          <p class="text-zinc-500 text-xs">Crie um novo evento temático</p>
        </div>
      </router-link>

      <router-link to="/vendedor/lotes/novo" class="bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 p-6 rounded-2xl flex items-center gap-4 transition-all group flex-1">
        <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
          <i class="pi pi-car"></i>
        </div>
        <div>
          <h4 class="text-white font-bold">Cadastrar Lote</h4>
          <p class="text-zinc-500 text-xs">Adicione um carrinho a um evento</p>
        </div>
      </router-link>
    </div>

  </div>
</template>
