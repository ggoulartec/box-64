<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../../supabase.js';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const raffleId = route.params.id;

const raffle = ref(null);
const tickets = ref([]);
const selectedTickets = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const isVerifying = ref(false);
const showPixModal = ref(false);
const showWinModal = ref(false);
const isDragging = ref(false);
const winningTicketsFound = ref([]);

// Estados do Sorteio
const timeLeft = ref('');
const finalCountdown = ref(null);
const isDrawing = ref(false);
let timerInterval = null;
let isCountdownRunning = false;
let ticketsChannel = null; // Canal do Realtime

const fetchRaffle = async () => {
  try {
    const { data, error } = await supabase
      .from('raffles')
      .select('*, raffle_tickets(*)')
      .eq('id', raffleId)
      .single();
      
    if (error) throw error;
    raffle.value = data;
    
    updateTicketsList(data.raffle_tickets);

    if (data.raffle_tickets.length >= data.total_tickets && !data.filled_at && data.status === 'active') {
        startRaffleClosing();
    }

    checkTimers();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// Função auxiliar para atualizar a grade de números
const updateTicketsList = (raffleTickets) => {
    if (!raffle.value) return;
    tickets.value = Array.from({ length: raffle.value.total_tickets }, (_, i) => ({
      number: i + 1,
      status: raffleTickets.find(t => t.ticket_number === i + 1) ? 'sold' : 'available'
    }));
};

const setupRealtime = () => {
    // Escuta mudanças nos tickets desta rifa específica
    ticketsChannel = supabase
        .channel(`raffle-${raffleId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'raffle_tickets', filter: `raffle_id=eq.${raffleId}` },
            async (payload) => {
                console.log('Mudança detectada nos tickets!', payload);
                // Quando houver mudança, buscamos a lista atualizada para garantir consistência
                const { data } = await supabase
                    .from('raffle_tickets')
                    .select('*')
                    .eq('raffle_id', raffleId);
                
                if (data) {
                    updateTicketsList(data);
                    // Atualiza também o objeto da rifa para que os contadores de barra de progresso funcionem
                    raffle.value.raffle_tickets = data;
                }
            }
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'raffles', filter: `id=eq.${raffleId}` },
            (payload) => {
                console.log('A rifa foi atualizada!', payload);
                const oldStatus = raffle.value?.status;
                raffle.value = { ...raffle.value, ...payload.new };
                
                // Se a rifa acabou de ser finalizada, solta os confetes para o comprador também!
                if (payload.new.status === 'finished' && oldStatus !== 'finished') {
                    isDrawing.value = false;
                    finalCountdown.value = null;
                    triggerConfetti();
                }
                
                checkTimers();
            }
        )
        .subscribe();
};

const startRaffleClosing = async () => {
    try {
      const now = new Date().toISOString();
      await supabase.from('raffles').update({ filled_at: now }).eq('id', raffleId);
      raffle.value.filled_at = now;
      checkTimers();
    } catch (e) { console.error(e); }
};

const checkTimers = () => {
    if (!raffle.value || !raffle.value.filled_at || raffle.value.status !== 'active') return;
    if (isCountdownRunning) return;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const filledTime = new Date(raffle.value.filled_at).getTime();
        const drawTime = filledTime + (10 * 60 * 100); // 1 hora
        const diff = drawTime - now;

        if (diff <= 0) {
            clearInterval(timerInterval);
            startFinalCountdown();
        } else if (diff <= 10000) {
            clearInterval(timerInterval);
            startFinalCountdown();
        } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timeLeft.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
};

const startFinalCountdown = () => {
    if (isCountdownRunning) return;
    isCountdownRunning = true;
    finalCountdown.value = 10;
    
    const finalInterval = setInterval(() => {
        finalCountdown.value--;
        if (finalCountdown.value <= 0) {
            clearInterval(finalInterval);
            finalCountdown.value = null;
            performAutoDraw();
        }
    }, 1000);
};

const performAutoDraw = async () => {
    isDrawing.value = true;
    
    // Pequeno delay para suspense visual
    setTimeout(async () => {
        // Verifica se alguém (vendedor ou outro user) já sorteou
        const { data: latest } = await supabase.from('raffles').select('*').eq('id', raffleId).single();
        
        if (latest.status === 'finished') {
            raffle.value = latest;
            isDrawing.value = false;
            triggerConfetti();
            return;
        }

        // Se for o primeiro a chegar aqui, realiza o sorteio
        const randomIndex = Math.floor(Math.random() * raffle.value.raffle_tickets.length);
        const winningTicket = raffle.value.raffle_tickets[randomIndex];

        const { error } = await supabase.from('raffles').update({
            status: 'finished',
            winner_ticket_number: winningTicket.ticket_number,
            winner_user_id: winningTicket.user_id,
            finished_at: new Date().toISOString()
        }).eq('id', raffleId);

        if (!error) {
            triggerConfetti();
        }
        
        await fetchRaffle();
        isDrawing.value = false;
    }, 3000);
};

const triggerConfetti = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
        window.confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#ff0000', '#ffffff', '#000000']
        });
    };
    document.head.appendChild(script);
};

// ... Funções de tickets e pagamento mantidas ...
const toggleTicket = (number) => {
  if (tickets.value[number - 1].status === 'sold') return;
  const idx = selectedTickets.value.indexOf(number);
  if (idx > -1) selectedTickets.value.splice(idx, 1);
  else { if (selectedTickets.value.length >= 200) return; selectedTickets.value.push(number); }
};
const handleMouseDown = (number) => { if (tickets.value[number - 1].status === 'sold') return; isDragging.value = true; toggleTicket(number); };
const handleMouseEnter = (number) => { if (isDragging.value && tickets.value[number - 1].status !== 'sold' && !selectedTickets.value.includes(number)) selectedTickets.value.push(number); };
const handleMouseUp = () => isDragging.value = false;

const totalPrice = computed(() => {
  if (!raffle.value) return 0;
  const qty = selectedTickets.value.length;
  const sortedDiscounts = [...raffle.value.discounts].sort((a, b) => b.qty - a.qty);
  const d = sortedDiscounts.find(x => qty >= x.qty);
  if (d) return (Math.floor(qty / d.qty) * d.price) + ((qty % d.qty) * raffle.value.ticket_price);
  return qty * raffle.value.ticket_price;
});

const handleBuy = async () => {
  isProcessing.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Faça login!'); return; }
    const { error } = await supabase.from('raffle_tickets').insert(selectedTickets.value.map(n => ({
      raffle_id: raffleId, user_id: session.user.id, ticket_number: n, status: 'pending'
    })));
    if (error) throw error;
    showPixModal.value = true;
  } catch (error) { toast.add({ severity: 'error', detail: 'Erro ao reservar.' }); }
  finally { isProcessing.value = false; }
};

const verifyPayment = async () => {
  isVerifying.value = true;
  setTimeout(() => {
    const found = raffle.value.winning_numbers.filter(w => selectedTickets.value.includes(w.number));
    isVerifying.value = false; showPixModal.value = false;
    if (found.length > 0) { winningTicketsFound.value = found; showWinModal.value = true; }
    else { toast.add({ severity: 'success', summary: 'Pago!' }); fetchRaffle(); }
  }, 2000);
};

const selectRandomTickets = (qty) => {
    selectedTickets.value = [];
    const available = tickets.value.filter(t => t.status === 'available').map(t => t.number);
    if (available.length === 0) return;
    const shuffled = available.sort(() => 0.5 - Math.random());
    selectedTickets.value = shuffled.slice(0, Math.min(qty, available.length));
    toast.add({ severity: 'info', summary: 'Seleção Rápida', detail: `${selectedTickets.value.length} cotas selecionadas!`, life: 2000 });
};

const activeWinningCount = computed(() => {
  if (!raffle.value) return 0;
  return raffle.value.winning_numbers.filter(w => !raffle.value.raffle_tickets.some(t => t.ticket_number === w.number)).length;
});

onMounted(() => {
  fetchRaffle();
  setupRealtime();
  window.addEventListener('mouseup', handleMouseUp);
});
onUnmounted(() => {
  window.removeEventListener('mouseup', handleMouseUp);
  clearInterval(timerInterval);
  if (ticketsChannel) supabase.removeChannel(ticketsChannel);
});
</script>

<template>
  <div v-if="isLoading" class="min-h-screen bg-zinc-950 p-12 flex items-center justify-center text-red-600">
    <i class="pi pi-spin pi-spinner text-4xl"></i>
  </div>

  <div v-else-if="raffle" class="max-w-7xl mx-auto py-12 px-4 relative">
    
    <!-- OVERLAY DE CONTAGEM REGRESSIVA FINAL -->
    <div v-if="finalCountdown !== null" class="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center text-white p-4">
        <h2 class="text-2xl font-black uppercase italic mb-8 animate-pulse">O Sorteio vai começar!</h2>
        <div class="text-[200px] font-black italic leading-none mb-8">
            {{ finalCountdown }}
        </div>
    </div>

    <!-- OVERLAY DE SORTEANDO -->
    <div v-if="isDrawing" class="fixed inset-0 z-[210] bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div class="w-32 h-32 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 class="text-4xl font-black uppercase italic tracking-tighter animate-pulse text-center px-6">Sorteando Ganhador...</h2>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2 space-y-8">
            <!-- Banner de Rifa Lotada / Cronômetro -->
            <div v-if="raffle.filled_at && raffle.status === 'active' && finalCountdown === null" class="bg-zinc-900 border-2 border-red-600 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-600/20">
                <div>
                    <h3 class="text-2xl font-black uppercase italic text-white mb-2">100% VENDIDA! 🚀</h3>
                    <p class="text-zinc-400 text-sm">Todas as cotas foram adquiridas. O sorteio iniciará em:</p>
                </div>
                <div class="bg-red-600 text-white px-8 py-4 rounded-2xl text-center min-w-[180px]">
                    <p class="text-[10px] font-black uppercase tracking-widest mb-1">Contagem Regressiva</p>
                    <p class="text-4xl font-black font-mono leading-none">{{ timeLeft }}</p>
                </div>
            </div>

            <div class="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <img :src="raffle.cover_image" class="w-full aspect-video object-cover" />
                <div class="p-8">
                    <div v-if="raffle.status === 'finished'" class="bg-green-600 text-white p-6 rounded-2xl mb-8 flex items-center justify-between shadow-lg shadow-green-600/20">
                        <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-80">Sorteio Finalizado</p>
                        <h2 class="text-3xl font-black italic uppercase leading-none">Temos um Ganhador!</h2>
                        </div>
                        <div class="text-right">
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-80">Cota Vencedora</p>
                        <p class="text-5xl font-black italic leading-none">#{{ raffle.winner_ticket_number }}</p>
                        </div>
                    </div>
                    <h1 class="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">{{ raffle.title }}</h1>
                    <p class="text-zinc-400 leading-relaxed">{{ raffle.description }}</p>
                </div>
            </div>

            <!-- COMPRA RÁPIDA -->
            <div v-if="raffle.status === 'active' && !raffle.filled_at" class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                <div class="flex items-center gap-2 mb-6">
                    <i class="pi pi-bolt text-red-600"></i>
                    <h3 class="text-white font-black uppercase tracking-widest text-sm">Compra Rápida</h3>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button v-for="qty in [5, 10, 25, 50]" :key="qty" @click="selectRandomTickets(qty)" class="group bg-zinc-950 border border-zinc-800 hover:border-red-600 p-4 rounded-2xl transition-all text-center active:scale-95">
                        <p class="text-red-500 font-black text-xl italic group-hover:scale-110 transition-transform">+{{ qty }}</p>
                        <p class="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Cotas</p>
                    </button>
                </div>
            </div>

            <div v-if="activeWinningCount > 0 && raffle.status === 'active'" class="bg-gradient-to-r from-red-600 to-red-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div class="relative z-10">
                    <h3 class="text-2xl font-black uppercase italic mb-2">Cotas Premiadas Ativas! ⚡</h3>
                    <p class="text-red-100 text-sm opacity-80">Ainda existem prêmios instantâneos escondidos!</p>
                </div>
                <i class="pi pi-bolt absolute -right-4 -bottom-4 text-9xl opacity-20 rotate-12"></i>
            </div>

            <div v-if="raffle.status === 'active' && !raffle.filled_at" class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 class="text-white font-black uppercase tracking-widest text-sm">Selecione suas cotas</h3>
                    <span class="text-[10px] text-zinc-500 font-bold uppercase border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <i class="pi pi-mouse"></i> Clique e arraste
                    </span>
                </div>
                <div class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 select-none">
                    <button 
                        v-for="t in tickets" :key="t.number"
                        @mousedown="handleMouseDown(t.number)" @mouseenter="handleMouseEnter(t.number)"
                        :disabled="t.status === 'sold'"
                        :class="[
                        'h-10 rounded-lg text-[10px] font-black transition-all border',
                        t.status === 'sold' ? 'bg-zinc-800 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-30' : 
                        selectedTickets.includes(t.number) ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' : 
                        'bg-zinc-950 border-zinc-800 text-zinc-500'
                        ]"
                    >
                        {{ t.number }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="raffle.status === 'active' && !raffle.filled_at" class="lg:col-span-1">
            <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sticky top-24 shadow-2xl">
                <h3 class="text-white font-bold uppercase tracking-widest text-sm mb-6 border-b border-zinc-800 pb-4 text-center">Checkout</h3>
                <div class="space-y-6">
                <div v-if="selectedTickets.length > 0" class="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-zinc-950 rounded-xl">
                    <span v-for="num in selectedTickets" :key="num" class="bg-red-600/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md border border-red-500/20">#{{ num }}</span>
                </div>
                <div v-else class="text-center py-6 text-zinc-600 italic text-sm">Nenhuma cota selecionada.</div>
                <div class="pt-6 border-t border-zinc-800">
                    <div class="flex justify-between items-center mb-6">
                    <span class="text-zinc-500 font-bold uppercase text-xs">Total:</span>
                    <span class="text-3xl font-black italic text-white">R$ {{ totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                    </div>
                    <button @click="handleBuy" :disabled="selectedTickets.length === 0 || isProcessing" class="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase italic py-5 rounded-2xl transition-all disabled:opacity-50">
                    Pagar via PIX
                    </button>
                </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modais -->
    <div v-if="showPixModal" class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-sm">
       <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <div v-if="isVerifying" class="py-10 text-white">
             <i class="pi pi-spin pi-spinner text-4xl text-red-600 mb-4"></i>
             <p class="font-bold animate-pulse">Conferindo seu pagamento...</p>
          </div>
          <template v-else>
            <h2 class="text-xl font-black text-white uppercase italic">Pagamento PIX</h2>
            <div class="bg-white p-3 rounded-2xl w-40 h-40 mx-auto">
               <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX_CODE" class="w-full h-full" />
            </div>
            <button @click="verifyPayment" class="w-full bg-red-600 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-[10px]">Já realizei o pagamento</button>
          </template>
       </div>
    </div>

    <div v-if="showWinModal" class="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
       <div class="bg-zinc-900 border border-red-500 rounded-3xl p-10 max-w-md w-full text-center space-y-6 text-white">
          <i class="pi pi-trophy text-6xl text-red-600 animate-bounce"></i>
          <h2 class="text-4xl font-black uppercase italic">VOCÊ GANHOU!</h2>
          <div class="space-y-3">
            <div v-for="w in winningTicketsFound" :key="w.number" class="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
              <span class="text-red-500 font-black text-xl italic">#{{ w.number }}</span>
              <span>{{ w.prize }}</span>
            </div>
          </div>
          <button @click="showWinModal = false" class="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Fechar</button>
       </div>
    </div>
  </div>
</template>
