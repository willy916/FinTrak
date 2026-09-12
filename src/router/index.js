import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/layout/MainLayout.vue';
import DashboardView from '../components/dashboard/DashboardView.vue';
import { isAuthenticated } from '@/services/authService';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Tableau de bord - Djeli MF', requiresAuth: true },
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/AnalyticsView.vue'),
        meta: { title: 'Analytics - Djeli MF', requiresAuth: true },
      },
      {
        // orgId optionnel : sans parametre la vue agrege tout le portefeuille.
        path: 'detailpme/:orgId?',
        name: 'Detailpme',
        component: () => import('../views/Detailpme.vue'),
        props: true,
        meta: { title: 'Détail PME - Djeli MF', requiresAuth: true },
      },
      {
        path: 'gestionpme',
        name: 'Gestionpme',
        component: () => import('../views/Gestionpme.vue'),
        meta: { title: 'Gestion PME - Djeli MF', requiresAuth: true },
      },
      {
        path: 'invest',
        name: 'Invest',
        component: () => import('../views/InvestView.vue'),
        meta: { title: 'Demandes de financement - Djeli MF', requiresAuth: true },
      },
      {
        path: 'produits',
        name: 'Produits',
        component: () => import('../views/ProduitsView.vue'),
        meta: { title: 'Produits - Djeli MF', requiresAuth: true },
      },
      {
        path: 'wallet',
        name: 'Wallet',
        component: () => import('../views/Wallet.vue'),
        meta: { title: 'Wallet - Djeli MF', requiresAuth: true },
      },
      {
        path: 'alertes',
        name: 'RiskAlerts',
        component: () => import('../views/RiskAlertsView.vue'),
        meta: { title: 'Alertes de risque - Djeli MF', requiresAuth: true },
      },
      {
        // Route sans accent : un caractere non-ASCII dans une URL casse
        // certains hebergeurs et l'import du fichier au build.
        path: 'parametres',
        name: 'Parametres',
        component: () => import('../views/Parametres.vue'),
        meta: { title: 'Paramètres - Djeli MF', requiresAuth: true },
      },
      {
        path: 'support',
        name: 'Support',
        component: () => import('../views/Support.vue'),
        meta: { title: 'Support - Djeli MF', requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { title: 'Connexion - Djeli', requiresGuest: true },
  },
  // Ancienne URL accentuee : on redirige au lieu de tomber en 404.
  { path: '/parametres-legacy', redirect: '/parametres' },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '404 - Page introuvable' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Djeli MF';

  const authed = isAuthenticated();

  if (to.meta.requiresAuth && !authed) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiresGuest && authed) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
