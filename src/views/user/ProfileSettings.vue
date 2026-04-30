<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const isLoading = ref(true);
const isSaving = ref(false);
const profile = ref({
  full_name: '',
  username: '',
  website: '',
  avatar_url: ''
});

const fetchProfile = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (data) {
      profile.value = { ...data };
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateProfile = async () => {
  isSaving.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão não encontrada');
    
    const updates = {
      id: session.user.id,
      full_name: profile.value.full_name || '',
      username: profile.value.username || '',
      website: profile.value.website || '',
      avatar_url: profile.value.avatar_url || '',
      updated_at: new Date()
    };

    // O upsert cria o registro se não existir ou atualiza se já existir
    const { error } = await supabase.from('profiles').upsert(updates, {
      onConflict: 'id'
    });

    if (error) throw error;

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Perfil atualizado com sucesso!',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível salvar as alterações.',
      life: 3000
    });
  } finally {
    isSaving.value = false;
  }
};

onMounted(fetchProfile);
</script>

<template>
  <div class="max-w-3xl mx-auto py-12 px-4">
    
    <div class="mb-10">
      <h1 class="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">Editar Perfil</h1>
      <p class="text-zinc-500">Mantenha seus dados atualizados para uma melhor experiência.</p>
    </div>

    <div v-if="isLoading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="h-16 bg-zinc-900 animate-pulse rounded-xl"></div>
    </div>

    <form v-else @submit.prevent="updateProfile" class="space-y-6 bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-xl">
      
      <!-- Nome Completo -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Nome Completo</label>
        <div class="relative">
          <i class="pi pi-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
          <input 
            v-model="profile.full_name"
            type="text" 
            placeholder="Seu nome completo"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
        </div>
      </div>

      <!-- Nome de Usuário -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Username (Apelido)</label>
        <div class="relative">
          <i class="pi pi-at absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
          <input 
            v-model="profile.username"
            type="text" 
            placeholder="como você quer ser chamado"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
        </div>
      </div>

      <!-- Website/Link -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Website / Portfólio</label>
        <div class="relative">
          <i class="pi pi-link absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
          <input 
            v-model="profile.website"
            type="url" 
            placeholder="https://seu-link.com"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
        </div>
      </div>

      <div class="pt-6">
        <button 
          type="submit" 
          :disabled="isSaving"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase italic py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <i v-if="isSaving" class="pi pi-spin pi-spinner"></i>
          {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>

    </form>

  </div>
</template>
