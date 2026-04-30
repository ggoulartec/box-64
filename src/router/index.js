import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase.js'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Catalog from '../views/Catalog.vue'
import Login from '../views/Login.vue'
import Auctions from '../views/Auctions.vue'

// Defina aqui os e-mails que têm permissão de acessar o Admin
const ADMIN_EMAILS = ['gou@box64.com', 'ggoulartec@gmail.com'];

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/sobre', component: About },
  { path: '/vitrine', component: Catalog },
  { path: '/leiloes', component: Auctions },
  { path: '/leilao/:id', component: () => import('../views/AuctionDetails.vue') },
  { path: '/lote/:id', component: () => import('../views/LotDetails.vue') },

  // User Routes
  { path: '/perfil', name: 'Perfil', component: () => import('../views/user/ProfileSettings.vue'), meta: { requiresAuth: true } },
  { path: '/meus-lances', name: 'Meus Lances', component: () => import('../views/user/MyBids.vue'), meta: { requiresAuth: true } },
  { path: '/minha-garagem', name: 'Minha Garagem', component: () => import('../views/user/MyGarage.vue'), meta: { requiresAuth: true } },

  // Admin Routes
  { path: '/admin', name: 'Dashboard', component: () => import('../views/admin/Dashboard.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/usuarios', name: 'Gerenciar Usuários', component: () => import('../views/admin/UserManagement.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/lotes', name: 'Gestão de Lotes', component: () => import('../views/admin/lotes/LotList.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/lotes/novo', name: 'Cadastrar Lote', component: () => import('../views/admin/lotes/NewLot.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/lotes/editar/:id', name: 'Editar Lote', component: () => import('../views/admin/lotes/NewLot.vue'), meta: { requiresAdmin: true } },

  // Seller Routes
  { path: '/vendedor', name: 'Painel do Vendedor', component: () => import('../views/seller/Dashboard.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/leiloes', name: 'Meus Leilões', component: () => import('../views/seller/auctions/AuctionList.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/leiloes/novo', name: 'Novo Leilão', component: () => import('../views/seller/auctions/NewAuction.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/leiloes/editar/:id', name: 'Editar Leilão', component: () => import('../views/seller/auctions/NewAuction.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/lotes', name: 'Meus Lotes', component: () => import('../views/seller/lotes/LotList.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/lotes/novo', name: 'Novo Lote', component: () => import('../views/seller/lotes/NewLot.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/lotes/editar/:id', name: 'Editar Lote', component: () => import('../views/seller/lotes/NewLot.vue'), meta: { requiresSeller: true } },
  
  // Raffle Routes (Seller)
  { path: '/vendedor/rifas', name: 'Minhas Rifas', component: () => import('../views/seller/raffles/RaffleList.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/rifas/nova', name: 'Nova Rifa', component: () => import('../views/seller/raffles/NewRaffle.vue'), meta: { requiresSeller: true } },
  { path: '/vendedor/rifas/editar/:id', name: 'Editar Rifa', component: () => import('../views/seller/raffles/NewRaffle.vue'), meta: { requiresSeller: true } },

  // Raffle Routes (Public)
  { path: '/rifas', name: 'Vitrine de Rifas', component: () => import('../views/raffles/RaffleVitrine.vue') },
  { path: '/rifa/:id', name: 'Detalhes da Rifa', component: () => import('../views/raffles/RaffleDetails.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Proteção de Rotas (Navigation Guard)
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresSeller = to.matched.some(record => record.meta.requiresSeller);

  // Se a rota for pública, deixa passar
  if (!requiresAuth && !requiresAdmin && !requiresSeller) {
    return next();
  }

  // Pega a sessão atual do Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Se não tem usuário e a rota é protegida, manda pro login
  if (!user) {
    return next('/login');
  }

  // Busca o role do perfil para validações de cargo
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = profile?.role || 'buyer';

  // Se a rota exige Admin, checa se o email está na lista de admins (ou role admin)
  if (requiresAdmin && !ADMIN_EMAILS.includes(user.email) && userRole !== 'admin') {
    alert('Acesso negado. Você não tem permissão de administrador.');
    return next('/vitrine');
  }

  // Se a rota exige Vendedor, checa se o role é seller ou admin
  if (requiresSeller && userRole !== 'seller') {
    alert('Acesso negado. Esta área é restrita a vendedores.');
    return next('/vitrine');
  }

  next();
})

export default router
