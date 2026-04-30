<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-zinc-950 border-t border-zinc-900 mt-auto">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- Brand -->
        <div class="col-span-1 md:col-span-1">
          <div class="flex items-center gap-2 mb-4">
            <i class="pi pi-box text-red-500 text-2xl"></i>
            <span class="font-bold text-xl tracking-tight text-white uppercase italic">Box 64</span>
          </div>
          <p class="text-zinc-400 text-sm leading-relaxed">
            A sua casa de leilões semanais especializada em miniaturas diecast premium e itens de colecionador.
          </p>
          <div class="flex gap-4 mt-6">
            <a href="#" class="text-zinc-500 hover:text-red-500 transition-colors"><i class="pi pi-instagram text-xl"></i></a>
            <a href="#" class="text-zinc-500 hover:text-red-500 transition-colors"><i class="pi pi-facebook text-xl"></i></a>
            <a href="#" class="text-zinc-500 hover:text-red-500 transition-colors"><i class="pi pi-whatsapp text-xl"></i></a>
          </div>
        </div>

        <!-- Links Rápidos -->
        <div>
          <h3 class="text-white font-semibold mb-4">Plataforma</h3>
          <ul class="space-y-2">
            <li><router-link to="/vitrine" class="text-zinc-400 hover:text-white text-sm transition-colors">Lotes Disponíveis</router-link></li>
            <li><router-link to="/leiloes" class="text-zinc-400 hover:text-white text-sm transition-colors">Próximos Leilões</router-link></li>
            <li><a href="#" class="text-zinc-400 hover:text-white text-sm transition-colors">Resultados Anteriores</a></li>
            <li><a href="#" class="text-zinc-400 hover:text-white text-sm transition-colors">Venda Conosco</a></li>
          </ul>
        </div>

        <!-- Ajuda -->
        <div>
          <h3 class="text-white font-semibold mb-4">Ajuda</h3>
          <ul class="space-y-2">
            <li><a href="#" class="text-zinc-400 hover:text-white text-sm transition-colors">Como funciona?</a></li>
            <li><a href="#" class="text-zinc-400 hover:text-white text-sm transition-colors">Regras do Leilão</a></li>
            <li><a href="#" class="text-zinc-400 hover:text-white text-sm transition-colors">Termos de Uso</a></li>
            <li><a href="#" class="text-zinc-400 hover:text-white text-sm transition-colors">Política de Privacidade</a></li>
          </ul>
        </div>

        <!-- Contato -->
        <div>
          <h3 class="text-white font-semibold mb-4">Contato</h3>
          <ul class="space-y-3">
            <li class="flex items-start gap-3">
              <i class="pi pi-envelope text-zinc-500 mt-1"></i>
              <span class="text-zinc-400 text-sm">contato@box64.com.br</span>
            </li>
            <li class="flex items-start gap-3">
              <i class="pi pi-phone text-zinc-500 mt-1"></i>
              <span class="text-zinc-400 text-sm">(11) 99999-9999</span>
            </li>
          </ul>
        </div>

      </div>
      
      <div class="border-t border-zinc-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-zinc-500 text-sm">
          &copy; {{ currentYear }} Box 64 Leilões. Todos os direitos reservados.
        </p>
        <div class="flex items-center gap-2">
          <span class="text-zinc-600 text-xs">Feito com</span>
          <i class="pi pi-heart-fill text-red-500 text-xs"></i>
          <span class="text-zinc-600 text-xs">para colecionadores</span>
        </div>
      </div>
    </div>
  </footer>
</template>
