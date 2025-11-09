import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/layout/MainLayout.vue';
import DashboardView from '../components/dashboard/DashboardView.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: {
          title: 'Dashboard - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/AnalyticsView.vue'),
        meta: {
          title: 'Analytics - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'detailpme',
        name: 'Detailpme',
        component: () => import('../views/Detailpme.vue'),
        meta: {
          title: 'Detail PME - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'gestionpme',
        name: 'Gestionpme',
        component: () => import('../views/Gestionpme.vue'),
        meta: {
          title: 'Gestionpme - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'support',
        name: 'Support',
        component: () => import('../views/Support.vue'),
        meta: {
          title: 'Support - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'paramètres',
        name: 'Paramètres',
        component: () => import('../views/Paramètres.vue'),
        meta: {
          title: 'Paramètres - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'wallet',
        name: 'Wallet',
        component: () => import('../views/Wallet.vue'),
        meta: {
          title: 'Wallet - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'invest',
        name: 'Invest',
        component: () => import('../views/InvestView.vue'),
        meta: {
          title: 'Investir - FinTrak MF',
          requiresAuth: true
        }
      },
      {
        path: 'pmeprofilemodal',
        name: 'PMEProfileModal',
        component: () => import('../components/common/PMEProfileModal.vue'),
        meta: {
          title: 'Settings - FinTrak MF',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: {
      title: 'Login - FinTrak',
      requiresGuest: true
    }
  },
  {
    path: '/inscription',
    name: 'Inscription',
    component: () => import('../views/auth/Inscription.vue'),
    meta: {
      title: 'Inscription - FinTrak',
      requiresGuest: true
    }
  },
  {
    path: '/verifypin',
    name: 'Verifypin',
    component: () => import('../views/auth/Verifypin.vue'),
    meta: {
      title: 'verify-pin - FinTrak',
      requiresGuest: true
    }
  },
  {
    path: '/createpin',
    name: 'Createpin',
    component: () => import('../views/auth/Createpin.vue'),
    meta: {
      title: 'Createpin - FinTrak',
      requiresGuest: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: '404 - Page Not Found'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Update document title
  document.title = to.meta.title || 'FinTrak MF';

  // Check authentication (implement your auth logic here)
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
