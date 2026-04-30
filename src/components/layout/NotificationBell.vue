<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../../supabase.js';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const notifications = ref([]);
const unreadCount = ref(0);
const showDropdown = ref(false);
const subscription = ref(null);

const fetchNotifications = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!error) {
    notifications.value = data;
    unreadCount.value = data.filter(n => !n.is_read).length;
  }
};

const markAsRead = async (id) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  
  if (!error) {
    const notif = notifications.value.find(n => n.id === id);
    if (notif) notif.is_read = true;
    unreadCount.value = notifications.value.filter(n => !n.is_read).length;
  }
};

const setupRealtime = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  subscription.value = supabase
    .channel('any-notification')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications'
    }, (payload) => {
      // Verificação manual para garantir que a notificação é do usuário logado
      if (payload.new.user_id === session.user.id) {
        notifications.value.unshift(payload.new);
        unreadCount.value++;
        
        toast.add({
          severity: 'warn',
          summary: payload.new.title,
          detail: payload.new.message,
          life: 5000
        });
      }
    })
    .subscribe();
};

onMounted(() => {
  fetchNotifications();
  setupRealtime();
  
  // Fechar dropdown ao clicar fora
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-container')) {
      showDropdown.value = false;
    }
  });
});

onUnmounted(() => {
  if (subscription.value) subscription.value.unsubscribe();
});
</script>

<template>
  <div class="relative notif-container">
    <!-- Ícone do Sino -->
    <button 
      @click="showDropdown = !showDropdown"
      class="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 relative transition-colors"
    >
      <i class="pi pi-bell text-lg"></i>
      <span v-if="unreadCount > 0" class="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-zinc-950 flex items-center justify-center">
        {{ unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div 
      v-if="showDropdown"
      class="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
        <h3 class="text-white font-bold text-sm uppercase tracking-widest">Notificações</h3>
        <span v-if="unreadCount > 0" class="text-[10px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
          {{ unreadCount }} novas
        </span>
      </div>

      <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
        <div v-if="notifications.length === 0" class="p-8 text-center">
          <i class="pi pi-bell-slash text-zinc-700 text-2xl mb-2"></i>
          <p class="text-zinc-500 text-xs italic">Nenhuma notificação por enquanto.</p>
        </div>
        
        <div 
          v-for="n in notifications" 
          :key="n.id"
          @click="markAsRead(n.id); n.link && router.push(n.link)"
          class="p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors relative"
          :class="{ 'bg-red-500/5': !n.is_read }"
        >
          <div v-if="!n.is_read" class="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-full"></div>
          
          <p class="text-white text-sm font-bold mb-1">{{ n.title }}</p>
          <p class="text-zinc-400 text-xs leading-relaxed">{{ n.message }}</p>
          <p class="text-zinc-600 text-[10px] mt-2 uppercase font-bold">{{ new Date(n.created_at).toLocaleTimeString() }}</p>
        </div>
      </div>

      <div class="p-3 bg-zinc-950/50 text-center border-t border-zinc-800">
        <button class="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
          Ver todas as atividades
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
</style>
