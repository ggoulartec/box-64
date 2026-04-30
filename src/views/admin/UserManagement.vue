<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const users = ref([]);
const isLoading = ref(true);
const isSaving = ref(null);

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    users.value = data;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateRole = async (userId, newRole) => {
  isSaving.value = userId;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: `Cargo atualizado para ${newRole.toUpperCase()}`,
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível atualizar o cargo.',
      life: 3000
    });
  } finally {
    isSaving.value = null;
  }
};

const getRoleLabel = (role) => {
  const roles = {
    'admin': 'Administrador',
    'seller': 'Vendedor',
    'buyer': 'Comprador'
  };
  return roles[role] || role;
};

const getRoleClass = (role) => {
  if (role === 'admin') return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (role === 'seller') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
};

onMounted(fetchUsers);
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-black italic uppercase tracking-tighter text-white">Usuários</h1>
        <p class="text-zinc-500">Gerencie cargos e permissões da plataforma.</p>
      </div>
      <button @click="fetchUsers" class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
        <i class="pi pi-refresh" :class="{'pi-spin': isLoading}"></i>
      </button>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-20 bg-zinc-900/50 rounded-2xl animate-pulse"></div>
    </div>

    <div v-else class="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-zinc-950/50 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
            <th class="px-6 py-4">Usuário</th>
            <th class="px-6 py-4">Cargo Atual</th>
            <th class="px-6 py-4 text-right">Alterar Para</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800">
          <tr v-for="user in users" :key="user.id" class="hover:bg-zinc-800/20 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700">
                  {{ user.email?.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-white font-bold text-sm">{{ user.email }}</p>
                  <p class="text-zinc-600 text-[10px] uppercase font-mono">{{ user.id.substring(0, 8) }}...</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span :class="getRoleClass(user.role)" class="text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2">
                <button 
                  v-for="role in ['buyer', 'seller', 'admin']" 
                  :key="role"
                  @click="updateRole(user.id, role); user.role = role"
                  :disabled="isSaving === user.id || user.role === role"
                  class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-30"
                  :class="user.role === role ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'"
                >
                  {{ role }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>
