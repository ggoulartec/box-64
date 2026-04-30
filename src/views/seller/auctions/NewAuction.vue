<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../../../supabase.js';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const isEditMode = computed(() => !!route.params.id);
const auctionId = route.params.id;

const isLoading = ref(false);

const auction = ref({
  title: '',
  description: '',
  cover_image: '',
  end_time: ''
});

onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();
        
      if (error) throw error;
      
      auction.value = {
        title: data.title,
        description: data.description,
        cover_image: data.cover_image,
        end_time: data.end_time.slice(0, 16) // Ajuste para datetime-local input
      };
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  }
});

const handleCreateAuction = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const dbPayload = {
      ...auction.value,
      seller_id: session.user.id,
      status: 'active'
    };

    if (isEditMode.value) {
      const { error } = await supabase
        .from('auctions')
        .update(dbPayload)
        .eq('id', auctionId);
      if (error) throw error;
      alert('Leilão atualizado!');
    } else {
      const { error } = await supabase
        .from('auctions')
        .insert([dbPayload]);
      if (error) throw error;
      alert('Leilão criado com sucesso!');
    }

    router.push('/vendedor/leiloes');
  } catch (error) {
    alert('Erro ao salvar leilão: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-3xl">
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
      <form @submit.prevent="handleCreateAuction" class="space-y-6">
        
        <div>
          <label class="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Título do Leilão</label>
          <input 
            v-model="auction.title"
            required
            type="text" 
            placeholder="Ex: Especial JDM Legends"
            class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Descrição</label>
          <textarea 
            v-model="auction.description"
            rows="4"
            placeholder="Conte um pouco sobre esta coleção..."
            class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">URL da Imagem de Capa</label>
            <input 
              v-model="auction.cover_image"
              type="url" 
              placeholder="https://..."
              class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Data de Encerramento</label>
            <input 
              v-model="auction.end_time"
              required
              type="datetime-local" 
              class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div class="pt-6 border-t border-zinc-800 flex justify-end gap-4">
          <button type="button" @click="$router.back()" class="px-6 py-3 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
          <button 
            type="submit" 
            :disabled="isLoading"
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-xl transition-all shadow-xl shadow-red-600/20 active:scale-95 disabled:opacity-50"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Leilão') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>
