<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../../supabase.js';
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();
const lots = ref([]);
const isLoading = ref(true);

const fetchLots = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    lots.value = data;
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    alert('Erro ao carregar lotes da base.');
  } finally {
    isLoading.value = false;
  }
};

const confirmDeletion = (event, id, modelName) => {
    confirm.require({
        target: event.currentTarget,
        message: `Deletar a miniatura "${modelName}" permanentemente?`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancelar',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Sim, Deletar',
            severity: 'danger'
        },
        accept: async () => {
            await deleteLot(id);
        }
    });
};

const deleteLot = async (id) => {
  try {
    const { error } = await supabase
      .from('lots')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Atualiza a lista local removendo o lote deletado
    lots.value = lots.value.filter(l => l.id !== id);
  } catch (error) {
    console.error('Erro ao deletar:', error);
    alert('Erro ao deletar lote: ' + error.message);
  }
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

onMounted(() => {
  fetchLots();
});
</script>

<template>
  <div class="space-y-6">
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">Gestão de Lotes</h1>
        <p class="text-zinc-400 text-sm">Visualize, edite ou remova as miniaturas cadastradas.</p>
      </div>
      <router-link to="/admin/lotes/novo" class="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20">
        <i class="pi pi-plus"></i> Novo Lote
      </router-link>
    </div>

    <!-- Tabela de Lotes -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      
      <!-- Estado de Carregamento -->
      <div v-if="isLoading" class="p-12 flex justify-center items-center">
        <i class="pi pi-spin pi-spinner text-red-500 text-3xl"></i>
      </div>

      <!-- Estado Vazio -->
      <div v-else-if="lots.length === 0" class="p-12 flex flex-col justify-center items-center text-zinc-500">
        <i class="pi pi-inbox text-5xl mb-4"></i>
        <p>Nenhum lote cadastrado ainda.</p>
        <router-link to="/admin/lotes/novo" class="text-red-500 mt-2 hover:underline">Comece cadastrando o primeiro carrinho.</router-link>
      </div>

      <!-- Lista -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-zinc-400">
          <thead class="text-xs text-zinc-500 bg-zinc-950/50 uppercase">
            <tr>
              <th class="px-6 py-4 font-medium">Lote</th>
              <th class="px-6 py-4 font-medium">Marca / Modelo</th>
              <th class="px-6 py-4 font-medium">Segmento / Série</th>
              <th class="px-6 py-4 font-medium">Lance Atual</th>
              <th class="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lote in lots" :key="lote.id" class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
              
              <!-- Número -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-bold border border-zinc-700">#{{ lote.number }}</span>
              </td>
              
              <!-- Modelo -->
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-red-500 text-xs font-bold uppercase">{{ lote.brand }}</span>
                  <span class="text-white font-medium line-clamp-1" :title="lote.model">{{ lote.model }}</span>
                </div>
              </td>
              
              <!-- Detalhes Ficha -->
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-zinc-300">{{ lote.segment || 'N/A' }}</span>
                  <span class="text-zinc-500 text-xs">{{ lote.series || 'Sem série' }}</span>
                </div>
              </td>
              
              <!-- Financeiro -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-green-400 font-bold">{{ formatCurrency(lote.current_bid) }}</span>
              </td>
              
              <!-- Ações -->
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2">
                  <router-link :to="'/admin/lotes/editar/' + lote.id" title="Editar" class="w-8 h-8 rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-colors">
                    <i class="pi pi-pencil text-xs"></i>
                  </router-link>
                  <button @click="confirmDeletion($event, lote.id, lote.model)" title="Excluir" class="w-8 h-8 rounded bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors">
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>
