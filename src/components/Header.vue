<script setup>
</script>

<template>
  <header class="flex flex-row justify-between items-center p-4 bg-surface-900">
    <router-link to="/" class="logo font-bold text-2xl text-surface-300">Box <span class="text-primary">64</span>
    </router-link>
    <div class="menu flex flex-row items-center gap-4">
      <router-link to="/" class="text-gray-400 hover:text-primary transition-all">Dashboard</router-link>
      <router-link to="/servicos" class="text-gray-400 hover:text-primary transition-all">Serviços</router-link>
      <router-link to="/clientes" class="text-gray-400 hover:text-primary transition-all">Clientes</router-link>
      <router-link to="/financeiro" class="text-gray-400 hover:text-primary transition-all">Financeiro</router-link>
      <router-link to="/relatorios" class="text-gray-400 hover:text-primary transition-all">Relatórios</router-link>
      <router-link to="/about" class="text-gray-400 hover:text-primary transition-all">About</router-link>
    </div>

    <div class="profile flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-all">
      <div class="flex justify-center">
        <OverlayBadge severity="danger">
          <i class="pi pi-envelope"/>
        </OverlayBadge>
      </div>

      <div class="img w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold">
        GG
      </div>
      <div class="user hidden md:block">
        <div class="name text-sm font-semibold text-gray-400">Gustavo Goularte</div>
        <div class="role text-xs text-gray-500">Administrador</div>
      </div>
      <div class="menu pi pi-chevron-down text-gray-400 text-xs"></div>
    </div>

  </header>
</template>

<style scoped>
</style>