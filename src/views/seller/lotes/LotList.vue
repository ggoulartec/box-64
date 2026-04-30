<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../../supabase.js';

const lots = ref([]);
const isLoading = ref(true);

const fetchLots = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('lots')
      .select(`
        *,
        auction:auctions (title)
      `)
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    lots.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchLots);
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
    <div class="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
      <h3 class="text-white font-bold italic uppercase tracking-widest">Meus Lotes (Carrinhos)</h3>
      <router-link to="/vendedor/lotes/novo" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
        + Adicionar Carrinho
      </router-link>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-zinc-400">
        <thead class="text-xs text-zinc-500 bg-zinc-950/50 uppercase tracking-widest">
          <tr>
            <th class="px-6 py-4">Miniatura</th>
            <th class="px-6 py-4">Leilão Vinculado</th>
            <th class="px-6 py-4">Lance Atual</th>
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr v-if="isLoading" v-for="i in 3" :key="i" class="animate-pulse">
            <td colspan="4" class="px-6 py-4 bg-zinc-900/50"></td>
          </tr>
          <tr v-else-if="lots.length === 0">
            <td colspan="4" class="px-6 py-12 text-center text-zinc-600 italic">Você ainda não cadastrou nenhum carrinho.</td>
          </tr>
          <tr v-for="lot in lots" :key="lot.id" class="hover:bg-zinc-800/30 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden border border-zinc-700">
                  <img v-if="lot.images && lot.images[0]" :src="lot.images[0]" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center"><i class="pi pi-car text-zinc-600"></i></div>
                </div>
                <div>
                  <p class="font-bold text-white leading-none mb-1">{{ lot.brand }} {{ lot.model }}</p>
                  <p class="text-[10px] text-zinc-500 uppercase font-black">Lote {{ lot.number }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-zinc-300 text-xs italic">{{ lot.auction?.title || 'Sem leilão' }}</span>
            </td>
            <td class="px-6 py-4 font-bold text-green-500">
              R$ {{ lot.current_bid.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2">
                <router-link :to="`/lote/${lot.id}`" target="_blank" title="Ver Público" class="p-2 text-zinc-500 hover:text-white transition-colors">
                  <i class="pi pi-eye"></i>
                </router-link>
                <router-link :to="`/vendedor/lotes/editar/${lot.id}`" title="Editar" class="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <i class="pi pi-pencil"></i>
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
