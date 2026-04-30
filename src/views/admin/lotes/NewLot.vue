<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../../../supabase.js';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const isEditMode = computed(() => !!route.params.id);
const lotId = route.params.id;

const isLoading = ref(false);

// Formulário reativo
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
  descricao: ''
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

onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from('lots')
        .select('*')
        .eq('id', lotId)
        .single();
        
      if (error) throw error;
      
      // Populando o form
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
        descricao: data.description
      };
      
      if (data.images && data.images.length > 0) {
        imagePreview.value = data.images[0];
      }
      
    } catch (error) {
      console.error('Erro ao carregar lote:', error);
      alert('Erro ao carregar dados do lote para edição.');
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
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const salvarLote = async () => {
  if(!form.value.marca || !form.value.modelo) {
    alert('Preencha a Marca e o Modelo');
    return;
  }
  
  isLoading.value = true;
  try {
    let finalImageUrl = null;

    // Faz o Upload da Imagem pro Supabase Storage
    if (imageFile.value) {
      const fileExt = imageFile.value.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lotes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lots')
        .upload(filePath, imageFile.value);

      if (uploadError) {
        console.error('Erro no upload', uploadError);
        alert('Erro ao fazer upload da imagem. Certifique-se que o bucket "lots" existe e é público.');
        throw uploadError;
      }

      // Pega a URL pública
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
    };

    if (finalImageUrl) {
      dbPayload.images = [finalImageUrl];
    }

    if (isEditMode.value) {
      // UPDATE
      const { error } = await supabase
        .from('lots')
        .update(dbPayload)
        .eq('id', lotId);
        
      if (error) throw error;
      alert('Lote atualizado com sucesso!');
      router.push('/admin/lotes');
      
    } else {
      // INSERT
      const loteNumber = Math.floor(Math.random() * 900) + 100;
      dbPayload.number = loteNumber.toString();
      dbPayload.current_bid = form.value.lanceInicial;
      dbPayload.end_time = new Date(Date.now() + 86400000 * 3);
      if (!dbPayload.images) dbPayload.images = [];
      
      const { error } = await supabase
        .from('lots')
        .insert([dbPayload]);
        
      if (error) throw error;
      alert('Lote salvo com sucesso no Supabase!');
      router.push('/admin/lotes');
    }
    
  } catch (error) {
    console.error('Erro ao salvar lote:', error.message);
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
        <h1 class="text-2xl font-bold text-white mb-1">{{ isEditMode ? 'Editar Lote' : 'Cadastrar Novo Lote' }}</h1>
        <p class="text-zinc-400 text-sm">Adicione ou edite uma miniatura para o leilão com todos os detalhes técnicos.</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link to="/admin/lotes" class="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Cancelar
        </router-link>
        <button @click="salvarLote" :disabled="isLoading" class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20">
          <i v-if="isLoading" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-save"></i> 
          {{ isLoading ? 'Salvando...' : 'Salvar Lote' }}
        </button>
      </div>
    </div>

    <!-- Seção: Identificação -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <i class="pi pi-id-card text-zinc-500"></i> Identificação
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Marca *</label>
          <select v-model="form.marca" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option value="" disabled>Selecione a marca</option>
            <option v-for="m in marcas" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Modelo *</label>
          <input type="text" v-model="form.modelo" placeholder="Ex: Datsun Bluebird 510" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Ano (Cast / Lançamento)</label>
          <input type="text" v-model="form.ano" placeholder="Ex: 2023" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Designer</label>
          <input type="text" v-model="form.designer" placeholder="Ex: Jun Imai" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
      </div>
    </div>

    <!-- Seção: Classificação -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <i class="pi pi-star text-zinc-500"></i> Classificação
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Segmento</label>
          <select v-model="form.segmento" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option value="" disabled>Selecione o segmento</option>
            <option v-for="s in segmentos" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Série (Opcional)</label>
          <input type="text" v-model="form.serie" placeholder="Ex: HW: '70s VS. '90s (2025)" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Escala</label>
          <select v-model="form.escala" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option v-for="e in escalas" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Seção: Detalhes Visuais e Construção -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <i class="pi pi-palette text-zinc-500"></i> Construção e Cores
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Cor da Carroceria</label>
          <input type="text" v-model="form.corCarroceria" placeholder="Ex: Spectraflame Red" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Cor das Janelas</label>
          <input type="text" v-model="form.corJanelas" placeholder="Ex: Transparente Leve" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Cor do Interior</label>
          <input type="text" v-model="form.corInterior" placeholder="Ex: Preto" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Material da Base</label>
          <select v-model="form.materialBase" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option v-for="mb in materiaisBase" :key="mb" :value="mb">{{ mb }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Tipo das Rodas</label>
          <select v-model="form.tipoRodas" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none">
            <option v-for="r in tiposRodas" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Seção: Financeiro -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <i class="pi pi-dollar text-zinc-500"></i> Financeiro
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Lance Inicial (R$)</label>
          <input type="number" v-model="form.lanceInicial" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Incremento Mínimo (R$)</label>
          <input type="number" v-model="form.incremento" class="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:border-red-500 focus:outline-none" />
        </div>
      </div>
    </div>

    <!-- Seção: Mídia e Descrição -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <i class="pi pi-image text-zinc-500"></i> Mídia e Detalhes
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <!-- Coluna de Imagem -->
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-2">Foto da Miniatura</label>
          <div class="w-full flex items-center justify-center">
            <label v-if="!imagePreview" class="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors">
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <i class="pi pi-cloud-upload text-3xl text-zinc-500 mb-2"></i>
                    <p class="mb-1 text-sm text-zinc-400"><span class="font-bold text-white">Clique para enviar</span> ou arraste o arquivo</p>
                    <p class="text-xs text-zinc-600">SVG, PNG, JPG ou GIF (MAX. 5MB)</p>
                </div>
                <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
            <div v-else class="relative w-full h-48 rounded-xl overflow-hidden group border border-zinc-700">
                <img :src="imagePreview" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label class="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        Trocar Imagem
                        <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
                    </label>
                </div>
            </div>
          </div>
        </div>
        
        <!-- Coluna de Descrição -->
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-2">Descrição do Lote</label>
          <textarea v-model="form.descricao" rows="7" placeholder="Escreva os detalhes da miniatura, avarias (se houver) e diferenciais..." class="w-full h-48 bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-red-500 focus:outline-none custom-scrollbar resize-none"></textarea>
        </div>
      </div>
    </div>

  </div>
</template>
