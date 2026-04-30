<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase.js';

const router = useRouter();
const email = ref('');
const password = ref('');
const fullName = ref('');
const role = ref('buyer'); // 'buyer' ou 'seller'
const isLoading = ref(false);
const isRegisterMode = ref(false);

const handleAuth = async () => {
  isLoading.value = true;
  try {
    if (isRegisterMode.value) {
      // Criação de Conta
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: fullName.value,
            role: role.value
          }
        }
      });
      if (error) throw error;
      alert('Conta criada com sucesso! Verifique seu e-mail (se habilitado) ou tente entrar agora.');
      isRegisterMode.value = false;
      password.value = '';
    } else {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) throw error;
      
      // O router guard automático fará a proteção agora
      router.push('/vitrine');
    }
  } catch (error) {
    alert('Erro: ' + error.message);
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden px-4">
    
    <!-- Elementos Decorativos de Fundo (Blur) -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-md z-10 relative">
      
      <!-- Logotipo Centralizado -->
      <div class="flex justify-center mb-8">
        <router-link to="/" class="flex items-center gap-2">
          <i class="pi pi-box text-red-500 text-3xl"></i>
          <span class="font-bold text-3xl tracking-tight text-white uppercase italic">Box 64</span>
        </router-link>
      </div>

      <!-- Card de Login -->
      <div class="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h2 class="text-2xl font-bold text-white mb-2 text-center">
          {{ isRegisterMode ? 'Criar Nova Conta' : 'Bem-vindo de volta' }}
        </h2>
        <p class="text-zinc-400 text-sm text-center mb-8">
          {{ isRegisterMode ? 'Cadastre-se para participar dos leilões' : 'Entre com sua conta para dar lances exclusivos' }}
        </p>

        <form @submit.prevent="handleAuth" class="space-y-5">
          
          <!-- Nome Completo (Apenas Cadastro) -->
          <div v-if="isRegisterMode">
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">Nome Completo</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <i class="pi pi-user"></i>
              </span>
              <input 
                type="text" 
                v-model="fullName"
                required
                placeholder="Seu nome" 
                class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <!-- Tipo de Conta (Apenas Cadastro) -->
          <div v-if="isRegisterMode" class="bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl flex gap-1">
            <button 
              type="button"
              @click="role = 'buyer'"
              class="flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              :class="role === 'buyer' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
            >
              <i class="pi pi-shopping-bag"></i> Sou Comprador
            </button>
            <button 
              type="button"
              @click="role = 'seller'"
              class="flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              :class="role === 'seller' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
            >
              <i class="pi pi-tag"></i> Sou Vendedor
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">E-mail</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <i class="pi pi-envelope"></i>
              </span>
              <input 
                type="email" 
                v-model="email"
                required
                placeholder="seu@email.com" 
                class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-sm font-medium text-zinc-400">Senha</label>
              <a v-if="!isRegisterMode" href="#" class="text-xs text-red-500 hover:text-red-400 font-medium transition-colors">Esqueceu a senha?</a>
            </div>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <i class="pi pi-lock"></i>
              </span>
              <input 
                type="password" 
                v-model="password"
                required
                placeholder="••••••••" 
                minlength="6"
                class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 mt-4 flex justify-center items-center gap-2"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner"></i>
            <span v-else>{{ isRegisterMode ? 'Cadastrar e Entrar' : 'Entrar no Leilão' }}</span>
          </button>
        </form>

        <!-- Divisor -->
        <div class="mt-8 mb-6 flex items-center">
          <div class="flex-grow border-t border-zinc-800"></div>
          <span class="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase tracking-widest font-semibold">
            {{ isRegisterMode ? 'Já tem uma conta?' : 'Novo por aqui?' }}
          </span>
          <div class="flex-grow border-t border-zinc-800"></div>
        </div>

        <button @click="isRegisterMode = !isRegisterMode" class="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-medium py-3 px-4 rounded-lg border border-zinc-700 transition-colors">
          {{ isRegisterMode ? 'Fazer Login' : 'Criar conta grátis' }}
        </button>

      </div>
      
      <!-- Dica -->
      <p class="text-zinc-600 text-xs text-center mt-6">
        <span class="font-bold">Nota de Segurança:</span> O Supabase enviará um email de confirmação caso você cadastre uma nova conta.
      </p>

    </div>
  </div>
</template>
