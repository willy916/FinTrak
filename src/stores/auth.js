/**
 * Petit store de session réactif — volontairement sans Pinia pour ne pas
 * ajouter de dépendance au projet.
 */
import { ref, computed } from 'vue';
import * as authService from '@/services/authService';

const session = ref(authService.getSession());

export function useAuth() {
  const isLoggedIn = computed(() => Boolean(session.value));

  const fullName = computed(() => {
    if (!session.value) return 'Utilisateur';
    const parts = [session.value.firstName, session.value.lastName].filter(Boolean);
    return parts.length ? parts.join(' ') : session.value.email;
  });

  const initials = computed(() => {
    if (!session.value) return 'U';
    const { firstName, lastName, email } = session.value;
    if (firstName || lastName) {
      return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || 'U';
    }
    return (email || 'U').charAt(0).toUpperCase();
  });

  async function login(email, password) {
    session.value = await authService.login(email, password);
    return session.value;
  }

  /** Révoque la session côté serveur, puis vide l'état local. */
  async function logout() {
    // On efface d'abord localement : l'UI ne doit pas attendre le réseau.
    session.value = null;
    await authService.logout();
  }

  function refresh() {
    session.value = authService.getSession();
  }

  return { session, isLoggedIn, fullName, initials, login, logout, refresh };
}

export default useAuth;
