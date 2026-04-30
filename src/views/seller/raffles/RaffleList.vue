<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../../supabase.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const raffles = ref([]);
const isLoading = ref(true);

const fetchRaffles = async () => {
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('raffles')
      .select('*, raffle_tickets(ticket_number)')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    raffles.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const deleteRaffle = async (id) => {
  if (!confirm('Tem certeza? Isso excluirá a rifa e todos os registros de cotas vendidas.')) return;
  
  try {
    const { error } = await supabase.from('raffles').delete().eq('id', id);
    if (error) throw error;
    
    raffles.value = raffles.value.filter(r => r.id !== id);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Rifa removida' });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: error.message });
  }
};

const drawWinner = async (raffle) => {
  if (!raffle.raffle_tickets || raffle.raffle_tickets.length === 0) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nenhuma cota vendida para sortear!' });
    return;
  }

  if (!confirm(`Deseja realizar o sorteio agora? Um ganhador será escolhido entre as ${raffle.raffle_tickets.length} cotas vendidas.`)) return;

  try {
    // 1. Escolher ticket aleatório
    const randomIndex = Math.floor(Math.random() * raffle.raffle_tickets.length);
    const winningTicket = raffle.raffle_tickets[randomIndex];

    // 2. Buscar dados do ganhador (profile) para exibir
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', winningTicket.user_id)
      .single();

    // 3. Atualizar a rifa no banco
    const { error } = await supabase
      .from('raffles')
      .update({
        status: 'finished',
        winner_ticket_number: winningTicket.ticket_number,
        winner_user_id: winningTicket.user_id
      })
      .eq('id', raffle.id);

    if (error) throw error;

    toast.add({ 
      severity: 'success', 
      summary: 'Sorteio Realizado!', 
      detail: `Ganhador: #${winningTicket.ticket_number} (${profile?.full_name || 'Usuário'})`,
      life: 10000 
    });
    
    fetchRaffles(); // Recarregar lista
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro no sorteio', detail: error.message });
  }
};

onMounted(fetchRaffles);
</script>

<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-4xl font-black italic uppercase tracking-tighter text-white">Minhas Rifas</h1>
        <p class="text-zinc-500">Gerencie suas campanhas e acompanhe as vendas de cotas.</p>
      </div>
      <router-link to="/vendedor/rifas/nova" class="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic px-6 py-3 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95">
        + Nova Rifa
      </router-link>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-64 bg-zinc-900 animate-pulse rounded-3xl"></div>
    </div>

    <div v-else-if="raffles.length === 0" class="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-20 text-center">
      <i class="pi pi-ticket text-6xl text-zinc-800 mb-4"></i>
      <p class="text-zinc-500 mb-6">Você ainda não criou nenhuma rifa.</p>
      <router-link to="/vendedor/rifas/nova" class="text-red-500 font-bold hover:underline">Criar minha primeira rifa</router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="r in raffles" :key="r.id" class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-all group relative">
        
        <div class="aspect-video bg-zinc-950 relative">
          <img :src="r.cover_image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute top-4 right-4">
            <span :class="r.status === 'active' ? 'bg-green-500' : 'bg-zinc-600'" class="text-[10px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              {{ r.status }}
            </span>
          </div>
        </div>

        <div class="p-6">
          <h3 class="text-xl font-bold text-white mb-2 truncate">{{ r.title }}</h3>
          
          <div class="space-y-4 mb-6">
            <!-- Barra de Progresso -->
            <div>
              <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <span>Vendas</span>
                <span class="text-white">{{ (((r.raffle_tickets?.length || 0) / r.total_tickets) * 100).toFixed(1) }}%</span>
              </div>
              <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full bg-red-600 transition-all" :style="{width: (((r.raffle_tickets?.length || 0) / r.total_tickets) * 100) + '%'}"></div>
              </div>
              <p class="text-[10px] text-zinc-600 mt-1 uppercase font-bold">{{ r.raffle_tickets?.length || 0 }} de {{ r.total_tickets }} cotas vendidas</p>
            </div>
            
            <div class="flex justify-between items-center">
              <div>
                <p class="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Preço da Cota</p>
                <p class="text-white font-black italic">R$ {{ r.ticket_price.toLocaleString('pt-BR') }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Cotas Premiadas</p>
                <p class="text-white font-black">{{ r.winning_numbers?.length || 0 }}</p>
              </div>
            </div>

            <!-- Status das Cotas Premiadas para o Vendedor -->
            <div v-if="r.winning_numbers?.length > 0" class="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
              <p class="text-[9px] text-zinc-600 uppercase font-black mb-2 tracking-widest">Status dos Prêmios</p>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="w in r.winning_numbers" :key="w.number" class="flex items-center justify-between text-[10px] bg-zinc-900 px-2 py-1.5 rounded-lg border border-zinc-800">
                   <span class="text-red-500 font-bold">#{{ w.number }}</span>
                   <span v-if="r.raffle_tickets?.some(t => t.ticket_number === w.number)" class="text-green-500 font-black uppercase flex items-center gap-1">
                     <i class="pi pi-check-circle"></i> SAIU!
                   </span>
                   <span v-else class="text-zinc-600 font-medium uppercase italic">Aguardando</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-zinc-800">
            <template v-if="r.status === 'active'">
              <button @click="drawWinner(r)" class="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase italic py-2 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95">
                Realizar Sorteio
              </button>
            </template>
            <template v-else-if="r.status === 'finished'">
              <div class="flex-1 bg-zinc-950 border border-green-500/30 rounded-xl p-2 text-center">
                <p class="text-[8px] text-zinc-500 uppercase font-black">Ganhador</p>
                <p class="text-green-500 font-black italic">Cota #{{ r.winner_ticket_number }}</p>
              </div>
            </template>
            
            <div class="flex gap-1">
              <router-link :to="`/rifa/${r.id}`" class="p-2 bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 text-white rounded-xl transition-colors">
                <i class="pi pi-external-link"></i>
              </router-link>
              <router-link v-if="r.status === 'active'" :to="`/vendedor/rifas/editar/${r.id}`" class="p-2 bg-zinc-800 flex items-center justify-center hover:bg-blue-600 text-white rounded-xl transition-colors">
                <i class="pi pi-pencil"></i>
              </router-link>
              <button @click="deleteRaffle(r.id)" class="p-2 bg-zinc-800 hover:bg-red-600 text-white rounded-xl transition-colors">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
