<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../../../supabase.js';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const isEditMode = computed(() => !!route.params.id);
const lotId = route.params.id;

const isLoading = ref(false);
const myAuctions = ref([]);

// Formulário reativo (Igual ao do ADM + auction_id)
const form = ref({
  marca: '',
  modelo: '',
  ano: '',
  designer: '',
  segmento: '',
  serie: '',
  escala: '1:64',
  corCarroceria: '',
  corJanelas: '',
  corInterior: '',
  materialBase: 'Metal',
  tipoRodas: 'Plástico',
  condicaoMini: 'Lacrado',
  condicaoEmbalagem: '10/10',
  lanceInicial: 0,
  incremento: 10,
  descricao: '',
  auction_id: null
});

const imageFile = ref(null);
const imagePreview = ref('');

// Opções para Selects
const marcas = ['Hot Wheels', 'MiniGT', 'Tarmac Works', 'Kaido House', 'Inno64', 'Matchbox', 'PGM'];
const segmentos = ['Mainline', 'Premium', 'RLC', 'Chase', 'Silver Series', 'Super Treasure Hunt', 'Treasure Hunt'];
const escalas = ['1:64', '1:43', '1:18'];
const materiaisBase = ['Metal', 'Plástico', 'Resina'];
const tiposRodas = ['Plástico (Basic)', 'Borracha (Real Riders)', 'Metal', 'Resina'];
const condicoesMini = ['Lacrado', 'Loose (Perfeito)', 'Loose (Com marcas)', 'Custom'];

const fetchMyAuctions = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('auctions')
    .select('id, title')
    .eq('seller_id', session.user.id)
    .eq('status', 'active');
    
  if (error) console.error(error);
  else myAuctions.value = data;
};

onMounted(async () => {
  await fetchMyAuctions();
  
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from('lots')
        .select('*')
        .eq('id', lotId)
        .single();
        
      if (error) throw error;
      
      form.value = {
        marca: data.brand,
        modelo: data.model,
        ano: data.year,
        designer: data.designer,
        segmento: data.segment,
        serie: data.series,
        escala: data.scale,
        corCarroceria: data.body_color,
        corJanelas: data.window_color,
        corInterior: data.interior_color,
        materialBase: data.base_material,
        tipoRodas: data.wheel_type,
        condicaoMini: data.condition,
        condicaoEmbalagem: data.box_condition,
        lanceInicial: data.starting_bid,
        incremento: data.min_increment,
        descricao: data.description,
        auction_id: data.auction_id
      };
      
      if (data.images && data.images.length > 0) {
        imagePreview.value = data.images[0];
      }
      
    } catch (error) {
      console.error('Erro ao carregar lote:', error);
    } finally {
      isLoading.value = false;
    }
  }
});

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => { imagePreview.value = e.target.result; };
  reader.readAsDataURL(file);
};

const salvarLote = async () => {
  if(!form.value.marca || !form.value.modelo || !form.value.auction_id) {
    alert('Preencha a Marca, Modelo e selecione um Leilão');
    return;
  }
  
  isLoading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    let finalImageUrl = null;

    if (imageFile.value) {
      const fileExt = imageFile.value.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lotes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lots')
        .upload(filePath, imageFile.value);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lots')
        .getPublicUrl(filePath);

      finalImageUrl = publicUrl;
    }

    const dbPayload = {
      brand: form.value.marca,
      model: form.value.modelo,
      year: form.value.ano,
      designer: form.value.designer,
      segment: form.value.segmento,
      series: form.value.serie,
      scale: form.value.escala,
      body_color: form.value.corCarroceria,
      window_color: form.value.corJanelas,
      interior_color: form.value.corInterior,
      base_material: form.value.materialBase,
      wheel_type: form.value.tipoRodas,
      condition: form.value.condicaoMini,
      box_condition: form.value.condicaoEmbalagem,
      description: form.value.descricao,
      starting_bid: form.value.lanceInicial,
      min_increment: form.value.incremento,
      auction_id: form.value.auction_id,
      seller_id: session.user.id
    };

    if (finalImageUrl) {
      dbPayload.images = [finalImageUrl];
    }

    if (isEditMode.value) {
      const { error } = await supabase
        .from('lots')
        .update(dbPayload)
        .eq('id', lotId);
        
      if (error) throw error;
      alert('Lote atualizado com sucesso!');
    } else {
      const loteNumber = Math.floor(Math.random() * 900) + 100;
      dbPayload.number = loteNumber.toString();
      dbPayload.current_bid = form.value.lanceInicial;
      
      // Data de encerramento do lote (pode ser a mesma do leilão ou individual)
      // Buscamos a data do leilão selecionado
      const { data: auction } = await supabase
        .from('auctions')
        .select('end_time')
        .eq('id', form.value.auction_id)
        .single();
      
      dbPayload.end_time = auction?.end_time || new Date(Date.now() + 86400000 * 3);

      const { error } = await supabase
        .from('lots')
        .insert([dbPayload]);
        
      if (error) throw error;
      alert('Lote cadastrado com sucesso!');
    }
    
    router.push('/vendedor/lotes');
  } catch (error) {
    alert('Erro ao salvar: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{{ isEditMode ? 'Editar Lote' : 'Novo Lote' }}</h1>
        <p class="text-zinc-400 text-sm">Preencha as especificações técnicas da sua miniatura.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="$router.back()" class="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">Cancelar</button>
        <button @click="salvarLote" :disabled="isLoading" class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95">
          <i v-if="isLoading" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-save"></i> 
          {{ isLoading ? 'SALVANDO...' : 'SALVAR LOTE' }}
        </button>
      </div>
    </div>

    <!-- Vinculo com Leilão -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 border-l-4 border-l-red-600">
      <label class="block text-sm font-bold text-red-500 mb-3 uppercase tracking-widest">Leilão (Evento)</label>
      <select 
        v-model="form.auction_id"
        required
        class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-red-500 focus:outline-none"
      >
        <option :value="null" disabled>Selecione onde este lote será vendido...</option>
        <option v-for="a in myAuctions" :key="a.id" :value="a.id">{{ a.title }}</option>
      </select>
    </div>

    <!-- Seção: Identificação -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 italic uppercase tracking-tighter">
        <i class="pi pi-id-card text-zinc-500"></i> Identificação
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Marca *</label>
          <select v-model="form.marca" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option value="" disabled>Selecione a marca</option>
            <option v-for="m in marcas" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Modelo *</label>
          <input type="text" v-model="form.modelo" placeholder="Ex: Skyline R34" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Ano</label>
          <input type="text" v-model="form.ano" placeholder="Ex: 2023" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Designer</label>
          <input type="text" v-model="form.designer" placeholder="Ex: Jun Imai" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
      </div>
    </div>

    <!-- Seção: Classificação -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 italic uppercase tracking-tighter">
        <i class="pi pi-star text-zinc-500"></i> Classificação
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Segmento</label>
          <select v-model="form.segmento" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option value="" disabled>Selecione</option>
            <option v-for="s in segmentos" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Série</label>
          <input type="text" v-model="form.serie" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Escala</label>
          <select v-model="form.escala" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option v-for="e in escalas" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Seção: Detalhes Visuais e Construção -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 italic uppercase tracking-tighter">
        <i class="pi pi-palette text-zinc-500"></i> Construção e Cores
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Cor Carroceria</label>
          <input type="text" v-model="form.corCarroceria" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Cor Janelas</label>
          <input type="text" v-model="form.corJanelas" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Material Base</label>
          <select v-model="form.materialBase" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option v-for="mb in materiaisBase" :key="mb" :value="mb">{{ mb }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Mídia -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 italic uppercase tracking-tighter">
        <i class="pi pi-image text-zinc-500"></i> Foto Principal
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-2">Foto da miniatura</label>
          <label v-if="!imagePreview" class="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-700 border-dashed rounded-2xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors">
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <i class="pi pi-cloud-upload text-3xl text-zinc-500 mb-2"></i>
                  <p class="text-sm text-zinc-400 font-bold">Enviar Foto</p>
              </div>
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
          </label>
          <div v-else class="relative w-full h-48 rounded-2xl overflow-hidden group border border-zinc-700 shadow-xl">
              <img :src="imagePreview" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label class="cursor-pointer bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm">Trocar Foto <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" /></label>
              </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-2">Descrição</label>
          <textarea v-model="form.descricao" rows="7" class="w-full h-48 bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-red-500 focus:outline-none resize-none"></textarea>
        </div>
      </div>
    </div>

    <!-- Financeiro -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 italic uppercase tracking-tighter">
        <i class="pi pi-dollar text-zinc-500"></i> Valores
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Lance Inicial (R$)</label>
          <input type="number" v-model="form.lanceInicial" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Incremento Mínimo (R$)</label>
          <input type="number" v-model="form.incremento" class="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
      </div>
    </div>

  </div>
</template>
