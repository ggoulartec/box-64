<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from './components/layout/AppNavbar.vue';
import AppFooter from './components/layout/AppFooter.vue';
import AdminLayout from './components/layout/AdminLayout.vue';
import SellerLayout from './components/layout/SellerLayout.vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const isSellerRoute = computed(() => route.path.startsWith('/vendedor'));
const isAuthRoute = computed(() => route.path === '/login');
</script>

<template>
  <!-- Layout Admin -->
  <AdminLayout v-if="isAdminRoute">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AdminLayout>

  <!-- Layout Vendedor -->
  <SellerLayout v-else-if="isSellerRoute">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </SellerLayout>

  <!-- Layout Auth (Login/Registro sem Header/Footer) -->
  <div v-else-if="isAuthRoute" class="min-h-screen bg-zinc-950">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>

  <!-- Layout Público -->
  <div v-else class="flex flex-col min-h-screen bg-zinc-950">
    <AppNavbar />
    <!-- Main Content Area with top/bottom padding to breathe -->
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
  </div>
  
  <ConfirmPopup />
</template>

<style>
/* Simple fade transition for route changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
