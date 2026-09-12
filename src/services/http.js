/**
 * Instance axios unique de l'application.
 * - injecte le token Bearer sur chaque requête
 * - sur 401, tente un rafraîchissement du token avant de déconnecter
 */
import axios from 'axios';

export const AUTH_TOKEN_KEY = 'djeli.token';
export const REFRESH_TOKEN_KEY = 'djeli.refreshToken';
export const SESSION_KEY = 'djeli.session';

/**
 * URL de base de l'API.
 *
 * Une chaîne vide est volontaire : les requêtes deviennent relatives
 * (`/api/bank-portal/...`) et passent par le proxy du serveur de dev Vite,
 * ce qui évite tout problème de CORS en local. Voir vite.config.js.
 *
 * En production, VITE_API_BASE_URL doit contenir l'URL complète de l'API,
 * sauf si le front est servi derrière le même domaine que le backend.
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = rawBaseUrl === undefined ? 'https://api.eonda.online' : rawBaseUrl;

const http = axios.create({ baseURL });

/** Instance sans intercepteur : évite toute boucle lors du refresh. */
const bareHttp = axios.create({ baseURL });

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('isAuthenticated');
}

function redirectToLogin() {
  clearSession();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Une seule requête de refresh à la fois : si plusieurs appels reçoivent 401
 * en parallèle, ils attendent tous la même promesse plutôt que d'en déclencher
 * un par requête (ce qui invaliderait les tokens en cascade).
 */
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = bareHttp
      .post('/api/bank-portal/auth/refresh', { refreshToken })
      .then(({ data }) => {
        const payload = data.data;
        localStorage.setItem(AUTH_TOKEN_KEY, payload.accessToken);
        if (payload.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
        }
        return payload.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Un 401 sur les routes d'authentification n'est pas rattrapable.
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      }

      redirectToLogin();
    } else if (status === 401 && !isAuthRoute) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

/**
 * Lit un message d'erreur renvoyé sous forme de Blob.
 * Quand une requête est faite avec responseType:'blob', axios enveloppe aussi
 * les réponses d'erreur JSON dans un Blob : sans cette lecture, on afficherait
 * « [object Blob] » au lieu du message du serveur.
 */
export async function readBlobError(blob) {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed.message || null;
  } catch {
    return null;
  }
}

/** Extrait un message d'erreur lisible depuis une erreur axios ou JS. */
export function extractErrorMessage(error) {
  if (axios.isAxiosError?.(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (error.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
    if (error.response?.status === 404) return 'Ressource introuvable.';
    if (!error.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue.';
}

export default http;
