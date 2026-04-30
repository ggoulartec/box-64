<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import BiddingPanel from '../components/auction/BiddingPanel.vue';
import { supabase } from '../supabase.js';

const route = useRoute();
const lotId = route.params.id;

const lot = ref(null);
const activeImage = ref('');
const bidders = ref([]);
const isLoading = ref(true);
const user = ref(null);
let subscription = null;

const fetchLot = async () => {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .eq('id', lotId)
    .single();
    
  if (error) {
    console.error('Erro ao buscar lote:', error);
    return;
  }
  
  lot.value = {
    id: data.id,
    number: data.number,
    brand: data.brand,
    model: data.model,
    year: data.year,
    designer: data.designer,
    segment: data.segment,
    series: data.series,
    scale: data.scale,
    bodyColor: data.body_color,
    windowColor: data.window_color,
    interiorColor: data.interior_color,
    baseMaterial: data.base_material,
    wheelType: data.wheel_type,
    condition: data.condition,
    boxCondition: data.box_condition,
    description: data.description,
    startingBid: data.starting_bid,
    currentBid: data.current_bid,
    minIncrement: data.min_increment,
    endTime: data.end_time,
    images: data.images || [],
    status: data.status || 'active'
  };
  
  if (lot.value.images.length > 0) {
    activeImage.value = lot.value.images[0];
  }
};

const fetchBids = async () => {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('lot_id', lotId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Erro ao buscar lances:', error);
    return;
  }
  
  bidders.value = data.map(bid => ({
    user: bid.user_email,
    userId: bid.user_id, // Adicionado para notificações
    amount: bid.amount,
    time: new Date(bid.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));
};

const setupRealtime = () => {
  subscription = supabase
    .channel(`lot-updates-${lotId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'bids', 
      filter: `lot_id=eq.${lotId}` 
    }, payload => {
      const newBid = payload.new;
      
      // Atualiza a lista de lances na tela
      bidders.value.unshift({
        user: newBid.user_email,
        userId: newBid.user_id,
        amount: newBid.amount,
        time: new Date(newBid.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      
      // Atualiza o valor atual do lote com animação
      if (lot.value) {
        lot.value.currentBid = newBid.amount;
      }
    })
    .subscribe();
};

const userRole = ref('buyer');

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  user.value = session?.user || null;

  if (user.value) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .maybeSingle();
    userRole.value = profile?.role || 'buyer';
  }

  await fetchLot();
  await fetchBids();
  setupRealtime();
  isLoading.value = false;
});

onUnmounted(() => {
  if (subscription) supabase.removeChannel(subscription);
});

const handleNewBid = async (amount) => {
  if (!user.value) {
    alert('Você precisa estar logado para dar lances! Clique em Entrar no topo da tela.');
    return;
  }

  if (userRole.value === 'admin' || userRole.value === 'seller') {
    alert('Administradores e Vendedores não podem participar de leilões como compradores por questões de integridade.');
    return;
  }

  // 1. Identifica o último licitante para notificar
  const lastBidder = bidders.value.length > 0 ? bidders.value[0] : null;
  
  // 2. Insere o novo lance
  const { error: bidError } = await supabase
    .from('bids')
    .insert([
      { 
        lot_id: lotId, 
        user_id: user.value.id,
        user_email: user.value.email, 
        amount: amount 
      }
    ]);
    
  if (bidError) {
    alert('Erro ao enviar lance: ' + bidError.message);
    return;
  }

  // 3. Se havia alguém na frente e não é o próprio usuário, notifica-o
  if (lastBidder && lastBidder.userId !== user.value.id) {
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: lastBidder.userId,
          title: 'Você foi superado!',
          message: `Alguém deu um lance de R$ ${amount.toLocaleString('pt-BR')} no ${lot.value.brand} ${lot.value.model}. Corra para recuperar!`,
          type: 'outbid',
          link: `/lote/${lotId}`
        }
      ]);
  }
};

const finalizeAuction = async () => {
  if (!lot.value || lot.value.status !== 'active') return;

  try {
    const { data: highestBid, error: bidError } = await supabase
      .from('bids')
      .select('user_id, user_email, amount')
      .eq('lot_id', lotId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();

    if (bidError || !highestBid) {
      await supabase.from('lots').update({ status: 'finished' }).eq('id', lotId);
      lot.value.status = 'finished';
      return;
    }

    const { error: updateError } = await supabase
      .from('lots')
      .update({ 
        status: 'finished',
        winner_id: highestBid.user_id 
      })
      .eq('id', lotId);

    if (updateError) throw updateError;

    await supabase.from('notifications').insert([
      {
        user_id: highestBid.user_id,
        title: '🏆 VITÓRIA! Item Arrematado!',
        message: `Parabéns! Você venceu o leilão do ${lot.value.brand} ${lot.value.model} com o lance de R$ ${highestBid.amount.toLocaleString('pt-BR')}.`,
        type: 'won',
        link: `/lote/${lotId}`
      }
    ]);

    lot.value.status = 'finished';
    lot.value.winnerId = highestBid.user_id;
  } catch (error) {
    console.error('Erro ao finalizar leilão:', error);
  }
};
</script>

<template>
  <div v-if="isLoading" class="max-w-7xl mx-auto py-32 flex flex-col items-center justify-center gap-4">
    <i class="pi pi-spin pi-spinner text-red-500 text-4xl"></i>
    <p class="text-zinc-400 font-medium text-sm">Carregando lote...</p>
  </div>

  <div v-else-if="lot" class="max-w-7xl mx-auto py-4">
    <!-- Breadcrumb e Voltar -->
    <div class="flex items-center gap-4 mb-8">
      <router-link to="/vitrine" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
        <i class="pi pi-arrow-left"></i>
      </router-link>
      <div class="flex items-center text-sm text-zinc-500 gap-2 font-medium">
        <router-link to="/" class="hover:text-zinc-300">Home</router-link>
        <i class="pi pi-chevron-right text-[10px]"></i>
        <router-link to="/vitrine" class="hover:text-zinc-300">Vitrine</router-link>
        <i class="pi pi-chevron-right text-[10px]"></i>
        <span class="text-white">Lote #{{ lot.number }}</span>
      </div>
    </div>

    <!-- Layout Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <!-- Coluna da Esquerda: Galeria de Imagens -->
      <div class="lg:col-span-7 space-y-4">
        <!-- Imagem Principal -->
        <div class="aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center group relative shadow-lg">
          <img v-if="activeImage" :src="activeImage" alt="Miniatura" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div v-else class="text-zinc-600 flex flex-col items-center gap-4">
            <i class="pi pi-camera text-6xl"></i>
            <span>Sem imagem disponível</span>
          </div>
          <!-- Lupa indicadora de Zoom -->
          <div class="absolute top-4 right-4 w-10 h-10 bg-zinc-950/80 backdrop-blur rounded-full flex items-center justify-center text-white border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <i class="pi pi-search-plus"></i>
          </div>
        </div>

        <!-- Thumbnails -->
        <div class="grid grid-cols-4 gap-4">
          <button 
            v-for="(img, index) in lot.images" 
            :key="index"
            @click="activeImage = img"
            class="aspect-square bg-zinc-900 border-2 rounded-xl overflow-hidden transition-all"
            :class="activeImage === img ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'"
          >
            <img :src="img" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Coluna da Direita: Informações e Lances -->
      <div class="lg:col-span-5 flex flex-col gap-8">
        
        <!-- Cabeçalho do Lote -->
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="bg-red-600/20 border border-red-500/30 text-red-500 text-xs font-bold px-3 py-1 rounded-md tracking-wider uppercase">
              Lote #{{ lot.number }}
            </span>
            <span class="text-zinc-400 font-bold tracking-widest uppercase text-sm">{{ lot.brand }}</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{{ lot.model }}</h1>
          
          <div class="flex flex-wrap gap-4 mb-6">
            <div class="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <i class="pi pi-arrows-alt text-zinc-500 text-sm"></i>
              <span class="text-zinc-300 text-sm font-medium">Escala {{ lot.scale }}</span>
            </div>
            <div class="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <i class="pi pi-box text-zinc-500 text-sm"></i>
              <span class="text-zinc-300 text-sm font-medium">{{ lot.condition }}</span>
            </div>
          </div>
          
          <p class="text-zinc-400 leading-relaxed text-sm mb-6">
            {{ lot.description }}
          </p>

          <!-- Ficha Técnica -->
          <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden mb-8">
            <div class="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800">
              <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <i class="pi pi-list text-zinc-500"></i> Ficha Técnica
              </h3>
            </div>
            <div class="grid grid-cols-2 text-sm">
              <div v-if="lot.year" class="px-4 py-3 border-b border-zinc-800/50 flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Ano / Cast</span>
                <span class="text-zinc-300 font-medium">{{ lot.year }}</span>
              </div>
              <div v-if="lot.designer" class="px-4 py-3 border-b border-zinc-800/50 border-l flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Designer</span>
                <span class="text-zinc-300 font-medium">{{ lot.designer }}</span>
              </div>
              <div v-if="lot.segment" class="px-4 py-3 border-b border-zinc-800/50 flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Segmento</span>
                <span class="text-zinc-300 font-medium">{{ lot.segment }}</span>
              </div>
              <div v-if="lot.series" class="px-4 py-3 border-b border-zinc-800/50 border-l flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Série</span>
                <span class="text-zinc-300 font-medium">{{ lot.series }}</span>
              </div>
              <div v-if="lot.bodyColor" class="px-4 py-3 border-b border-zinc-800/50 flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Cor da Carroceria</span>
                <span class="text-zinc-300 font-medium">{{ lot.bodyColor }}</span>
              </div>
              <div v-if="lot.windowColor" class="px-4 py-3 border-b border-zinc-800/50 border-l flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Cor das Janelas</span>
                <span class="text-zinc-300 font-medium">{{ lot.windowColor }}</span>
              </div>
              <div v-if="lot.baseMaterial" class="px-4 py-3 border-b border-zinc-800/50 flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Material da Base</span>
                <span class="text-zinc-300 font-medium">{{ lot.baseMaterial }}</span>
              </div>
              <div v-if="lot.wheelType" class="px-4 py-3 border-b border-zinc-800/50 border-l flex flex-col gap-1">
                <span class="text-zinc-500 text-xs">Tipo de Rodas</span>
                <span class="text-zinc-300 font-medium">{{ lot.wheelType }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Componente do Painel de Lances -->
        <BiddingPanel 
          :currentBid="lot.currentBid" 
          :endTime="lot.endTime" 
          :minIncrement="lot.minIncrement || 10" 
          :bidders="bidders"
          @place-bid="handleNewBid"
          @time-up="finalizeAuction"
        />

        <!-- Aviso de Finalizado -->
        <div v-if="lot.status === 'finished'" class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 border-l-4 border-l-red-500">
           <div class="flex items-center gap-3">
             <i class="pi pi-check-circle text-red-500 text-2xl"></i>
             <div>
               <p class="text-white font-bold italic uppercase">Leilão Finalizado</p>
               <p class="text-zinc-500 text-xs">Este lote não aceita mais lances.</p>
             </div>
           </div>
        </div>

        <!-- Info Adicional do Vendedor/Garantias -->
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <ul class="space-y-3">
            <li class="flex items-start gap-3">
              <i class="pi pi-check-circle text-green-500 mt-0.5"></i>
              <div>
                <p class="text-zinc-300 text-sm font-medium">Autenticidade Garantida</p>
                <p class="text-zinc-500 text-xs">Miniatura verificada por nossa equipe.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <i class="pi pi-truck text-blue-500 mt-0.5"></i>
              <div>
                <p class="text-zinc-300 text-sm font-medium">Envio Seguro</p>
                <p class="text-zinc-500 text-xs">Embalagem reforçada para colecionadores.</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </div>
</template>
