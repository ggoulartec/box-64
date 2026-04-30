<template>
  <div class="max-w-4xl mx-auto py-12 px-4 flex flex-col gap-16">
    
    <!-- Hero Section -->
    <header class="text-center space-y-6">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600/10 border border-red-500/20 rounded-full text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">
        <i class="pi pi-info-circle text-[10px]"></i> Nossa História
      </div>
      <h1 class="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">
        Mais que um leilão,<br/> uma <span class="text-red-600">Comunidade</span>
      </h1>
      <p class="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
        A Box-64 nasceu da paixão por detalhes, curvas perfeitas e a nostalgia de ter o mundo nas mãos na escala 1:64.
      </p>
    </header>

    <!-- Content Sections -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <span class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white italic font-black">1</span>
          A Origem
        </h2>
        <p class="text-zinc-400 leading-relaxed">
          Fundada por colecionadores para colecionadores, a Box-64 surgiu para resolver um problema comum no Brasil: a dificuldade de encontrar modelos exclusivos de marcas como <span class="text-white font-medium">MiniGT, Tarmac Works e Inno64</span> com preços justos e procedência garantida.
        </p>
        <p class="text-zinc-400 leading-relaxed">
          O que começou como um pequeno grupo de trocas no WhatsApp se transformou na plataforma de leilões mais dinâmica do país, onde a transparência e a qualidade vêm em primeiro lugar.
        </p>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl aspect-square flex items-center justify-center relative overflow-hidden group shadow-2xl">
        <i class="pi pi-car text-9xl text-zinc-800 group-hover:text-red-900/30 transition-all duration-700 group-hover:scale-110"></i>
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60"></div>
        <div class="absolute bottom-8 left-8 right-8 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-xl">
          <p class="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Missão</p>
          <p class="text-white text-sm font-medium italic">"Democratizar o acesso a miniaturas premium no mercado brasileiro."</p>
        </div>
      </div>
    </div>

    <!-- Values Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-4 hover:border-red-500/30 transition-colors">
        <div class="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
          <i class="pi pi-check-circle text-xl"></i>
        </div>
        <h3 class="text-white font-bold">Autenticidade</h3>
        <p class="text-zinc-500 text-sm">Garantimos que cada miniatura seja 100% original e esteja no estado descrito.</p>
      </div>
      <div class="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-4 hover:border-red-500/30 transition-colors">
        <div class="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
          <i class="pi pi-clock text-xl"></i>
        </div>
        <h3 class="text-white font-bold">Transparência</h3>
        <p class="text-zinc-500 text-sm">Lances em tempo real auditados. Sem lances fantasmada ou manipulação.</p>
      </div>
      <div class="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-4 hover:border-red-500/30 transition-colors">
        <div class="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
          <i class="pi pi-heart text-xl"></i>
        </div>
        <h3 class="text-white font-bold">Paixão</h3>
        <p class="text-zinc-500 text-sm">Somos movidos pelo hobby. Tratamos seu carrinho como se fosse nosso.</p>
      </div>
    </div>

    <!-- CTA Section -->
    <section class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center space-y-8 relative overflow-hidden">
      <div class="z-10 relative">
        <h2 class="text-3xl font-bold text-white italic uppercase tracking-tighter">Pronto para aumentar sua garagem?</h2>
        <p class="text-zinc-400 max-w-xl mx-auto mt-4">
          Junte-se a milhares de colecionadores e comece a dar seus lances hoje mesmo na Box-64.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <router-link to="/vitrine" class="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-xl shadow-red-600/20 active:scale-95">
            Explorar Leilões
          </router-link>
          <router-link to="/login" class="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-10 py-4 rounded-xl border border-zinc-700 transition-all active:scale-95">
            Criar Conta
          </router-link>
        </div>
      </div>
      <!-- Bg Decorative -->
      <div class="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full"></div>
    </section>

  </div>
</template>

<script setup>
// Sem lógica necessária por enquanto, apenas conteúdo estático premium.
</script>
