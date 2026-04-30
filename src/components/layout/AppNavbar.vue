<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../supabase.js';
import NotificationBell from './NotificationBell.vue';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const isProfileDropdownOpen = ref(false);
const user = ref(null);
const userRole = ref('buyer');
let authListener = null;

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  isProfileDropdownOpen.value = false;
  router.push('/');
};

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  user.value = data.session?.user || null;

  if (user.value) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .maybeSingle();
    userRole.value = profile?.role || 'buyer';
  }

  const { data: authSubscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user || null;
    if (user.value) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.value.id)
        .maybeSingle();
      userRole.value = profile?.role || 'buyer';
    }
  });
  authListener = authSubscription;

  // Fechar dropdown ao clicar fora
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown-container')) {
      isProfileDropdownOpen.value = false;
    }
  });
});

onUnmounted(() => {
  if (authListener) authListener.subscription.unsubscribe();
});
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center gap-2 cursor-pointer" @click="$router.push('/')">
          <i class="pi pi-box text-red-500 text-2xl"></i>
          <span class="font-bold text-xl tracking-tight text-white uppercase italic">Box 64</span>
        </div>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex space-x-8">
          <router-link to="/" class="text-zinc-300 hover:text-white transition-colors text-sm font-medium" active-class="text-red-500">Início</router-link>
          <router-link to="/leiloes" class="text-zinc-300 hover:text-white transition-colors text-sm font-medium" active-class="text-red-500">Leilões</router-link>
          <router-link to="/vitrine" class="text-zinc-300 hover:text-white transition-colors text-sm font-medium" active-class="text-red-500">Vitrine</router-link>
          <router-link to="/rifas" class="text-zinc-300 hover:text-white transition-colors text-sm font-medium" active-class="text-red-500">Rifas</router-link>
          <router-link to="/sobre" class="text-zinc-300 hover:text-white transition-colors text-sm font-medium" active-class="text-red-500">Sobre nós</router-link>
        </nav>

        <!-- Profile / Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- Notificações -->
          <NotificationBell v-if="user" />
          <button v-else class="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors">
            <i class="pi pi-bell"></i>
          </button>
          
          <div class="h-8 w-px bg-zinc-800"></div>
          
          <!-- Desktop: Área do Usuário Logado -->
          <div v-if="user" class="relative profile-dropdown-container">
            <button 
              @click="isProfileDropdownOpen = !isProfileDropdownOpen"
              class="flex items-center gap-3 p-1 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <div class="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30 font-bold">
                {{ user.email.charAt(0).toUpperCase() }}
              </div>
              <span class="max-w-[120px] truncate text-sm font-medium text-zinc-300">{{ user.email }}</span>
              <i class="pi pi-chevron-down text-[10px] text-zinc-500 transition-transform" :class="{'rotate-180': isProfileDropdownOpen}"></i>
            </button>

            <!-- Dropdown Menu -->
            <div 
              v-if="isProfileDropdownOpen"
              class="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div class="p-4 border-b border-zinc-800 bg-zinc-950/50">
                <p class="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Conta</p>
                <p class="text-white text-xs truncate font-bold">{{ user.email }}</p>
              </div>

              <div class="p-2">
                <router-link v-if="userRole === 'buyer'" @click="isProfileDropdownOpen = false" to="/painel" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white hover:bg-zinc-800 transition-colors font-bold">
                  <i class="pi pi-th-large text-red-500"></i> Meu Painel
                </router-link>

                <router-link @click="isProfileDropdownOpen = false" to="/perfil" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                  <i class="pi pi-user-edit"></i> Editar Perfil
                </router-link>

                <!-- Opções Baseadas em Cargo -->
                <div class="my-2 border-t border-zinc-800"></div>

                <router-link v-if="userRole === 'admin'" @click="isProfileDropdownOpen = false" to="/admin" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors font-bold">
                  <i class="pi pi-shield"></i> Painel Admin
                </router-link>

                <router-link v-if="userRole === 'seller'" @click="isProfileDropdownOpen = false" to="/vendedor" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-500 hover:bg-blue-500/10 transition-colors font-bold">
                  <i class="pi pi-shop"></i> Painel Vendedor
                </router-link>

                <button @click="handleLogout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-colors text-left font-medium mt-2">
                  <i class="pi pi-sign-out"></i> Sair da Conta
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: Visitante -->
          <router-link v-else to="/login" class="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <i class="pi pi-user text-zinc-400"></i>
            </div>
            <span>Entrar / Cadastrar</span>
          </router-link>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden flex items-center">
          <button @click="toggleMobileMenu" class="text-zinc-400 hover:text-white p-2">
            <i :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-2xl"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div v-show="isMobileMenuOpen" class="md:hidden bg-zinc-900 border-b border-zinc-800 absolute w-full">
      <div class="space-y-1 px-4 pb-3 pt-2">
        <router-link to="/" class="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white" active-class="bg-zinc-800 text-red-500">Início</router-link>
        <router-link to="/leiloes" class="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white" active-class="bg-zinc-800 text-red-500">Leilões</router-link>
        <router-link to="/vitrine" class="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white" active-class="bg-zinc-800 text-red-500">Vitrine</router-link>
        <router-link to="/rifas" class="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white" active-class="bg-zinc-800 text-red-500">Rifas</router-link>
        <router-link to="/sobre" class="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white" active-class="bg-zinc-800 text-red-500">Sobre nós</router-link>
      </div>
      <div class="border-t border-zinc-800 pb-4 pt-4">
        <div v-if="user" class="px-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30 font-bold text-lg">
                {{ user.email.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div>
              <div class="text-base font-medium leading-none text-white truncate max-w-[200px]">{{ user.email }}</div>
            </div>
          </div>
          <router-link to="/painel" class="block rounded-md py-2 text-base font-medium text-white flex items-center gap-2">
            <i class="pi pi-th-large text-red-500"></i> Meu Painel
          </router-link>
          <button @click="handleLogout" class="mt-2 block rounded-md py-2 text-base font-medium text-red-500 hover:text-red-400">
            Sair
          </button>
        </div>
        <div v-else class="flex items-center px-5 gap-3 cursor-pointer hover:bg-zinc-800/50 p-2 rounded-lg" @click="$router.push('/login'); toggleMobileMenu()">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <i class="pi pi-user text-zinc-400"></i>
            </div>
          </div>
          <div>
            <div class="text-base font-medium leading-none text-white">Visitante</div>
            <div class="text-sm font-medium leading-none text-zinc-400 mt-1">Acesse sua conta</div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
