<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../../supabase.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const auctions = ref([]);
const isLoading = ref(true);

const fetchAuctions = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    auctions.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const deleteAuction = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este leilão? Todos os lotes associados ficarão sem leilão vinculado.')) return;

  try {
    const { error } = await supabase
      .from('auctions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro Supabase:', error);
      throw error;
    }

    // Só remove da tela se o banco confirmou a exclusão
    auctions.value = auctions.value.filter(a => a.id !== id);
    
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Leilão excluído do banco de dados',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao excluir: ' + (error.message || 'Erro de permissão RLS'),
      life: 5000
    });
  }
};

onMounted(fetchAuctions);
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
    <div class="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
      <h3 class="text-white font-bold italic uppercase tracking-widest">Meus Leilões (Eventos)</h3>
      <router-link to="/vendedor/leiloes/novo" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
        + Novo Evento
      </router-link>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-zinc-400">
        <thead class="text-xs text-zinc-500 bg-zinc-950/50 uppercase tracking-widest font-black">
          <tr>
            <th class="px-6 py-4">Título do Evento</th>
            <th class="px-6 py-4 text-center">Status</th>
            <th class="px-6 py-4">Encerramento</th>
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr v-if="isLoading" v-for="i in 3" :key="i" class="animate-pulse">
            <td colspan="4" class="px-6 py-8 bg-zinc-900/50"></td>
          </tr>
          <tr v-else-if="auctions.length === 0">
            <td colspan="4" class="px-6 py-12 text-center text-zinc-600 italic">Você ainda não criou nenhum leilão.</td>
          </tr>
          <tr v-for="auction in auctions" :key="auction.id" class="hover:bg-zinc-800/30 transition-colors group">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden border border-zinc-700 group-hover:border-red-500/50 transition-colors">
                  <img v-if="auction.cover_image" :src="auction.cover_image" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center"><i class="pi pi-image text-zinc-600"></i></div>
                </div>
                <span class="font-bold text-white group-hover:text-red-500 transition-colors">{{ auction.title }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-center">
              <span :class="auction.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'" class="text-[10px] font-black uppercase tracking-widest border px-3 py-1 rounded-full">
                {{ auction.status }}
              </span>
            </td>
            <td class="px-6 py-4 font-mono text-xs">
              {{ new Date(auction.end_time).toLocaleString('pt-BR') }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-1">
                <router-link :to="`/leilao/${auction.id}`" target="_blank" title="Ver Público" class="p-2 text-zinc-500 hover:text-white transition-colors">
                  <i class="pi pi-external-link"></i>
                </router-link>
                <router-link :to="`/vendedor/leiloes/editar/${auction.id}`" title="Editar" class="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <i class="pi pi-pencil"></i>
                </router-link>
                <button @click="deleteAuction(auction.id)" title="Excluir" class="p-2 text-zinc-500 hover:text-red-600 transition-colors">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
