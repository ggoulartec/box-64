<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const userEmail = ref('');

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    userEmail.value = session.user.email;
  }
});
</script>

<template>
  <div class="flex min-h-screen bg-zinc-950">
    
    <!-- Sidebar -->
    <aside class="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed inset-y-0 left-0 z-50">
      
      <!-- Brand -->
      <div class="h-16 flex items-center gap-2 px-6 border-b border-zinc-800 bg-zinc-950/50">
        <i class="pi pi-box text-red-500 text-2xl"></i>
        <span class="font-bold text-xl tracking-tight text-white uppercase italic">Box 64 <span class="text-[10px] text-red-500 font-normal ml-1">VENDEDOR</span></span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        
        <p class="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Painel</p>
        <router-link to="/vendedor" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-home"></i> Visão Geral
        </router-link>

        <p class="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-2">Leilões (Eventos)</p>
        <router-link to="/vendedor/leiloes" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor/leiloes' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-calendar"></i> Meus Leilões
        </router-link>
        <router-link to="/vendedor/leiloes/novo" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor/leiloes/novo' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-plus-circle"></i> Criar Evento
        </router-link>

        <p class="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-2">Itens (Lotes)</p>
        <router-link to="/vendedor/lotes" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor/lotes' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-list"></i> Meus Lotes
        </router-link>
        <router-link to="/vendedor/lotes/novo" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor/lotes/novo' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-plus"></i> Cadastrar Lote
        </router-link>

        <p class="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-2">Ações (Rifas)</p>
        <router-link to="/vendedor/rifas" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor/rifas' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-ticket"></i> Minhas Rifas
        </router-link>
        <router-link to="/vendedor/rifas/nova" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" active-class="bg-red-600/10 text-red-500" :class="$route.path === '/vendedor/rifas/nova' ? '' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'">
          <i class="pi pi-plus-circle"></i> Criar Rifa
        </router-link>

        <div class="pt-10">
          <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <i class="pi pi-external-link"></i> Ir para a Loja
          </router-link>
        </div>

      </nav>

      <!-- User Profile -->
      <div class="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <i class="pi pi-user text-red-500 text-sm"></i>
          </div>
          <div class="flex-1 overflow-hidden">
            <p class="text-xs font-medium text-white truncate">{{ userEmail }}</p>
            <button @click="handleLogout" class="text-[10px] text-zinc-500 hover:text-red-500 truncate uppercase font-bold tracking-tighter">Sair</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content wrapper (offset sidebar width) -->
    <div class="flex-1 pl-64 flex flex-col min-h-screen">
      
      <!-- Top Header -->
      <header class="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-40 flex items-center justify-between px-8">
        <h2 class="text-white font-semibold capitalize">{{ $route.name || 'Painel do Vendedor' }}</h2>
        <div class="flex items-center gap-4 text-zinc-400">
          <button class="hover:text-white transition-colors relative">
            <i class="pi pi-bell"></i>
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      <!-- Slot for views -->
      <main class="flex-1 p-8 overflow-y-auto">
        <slot></slot>
      </main>

    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
</style>
