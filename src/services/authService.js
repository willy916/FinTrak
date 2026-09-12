/**
 * Authentification du portail microfinance.
 * Connexion par e-mail + mot de passe, réinitialisation par code OTP envoyé par mail.
 */
import http, { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_KEY, clearSession } from './http';

const PREFIX = '/api/bank-portal/auth';

/**
 * @returns {Promise<{token:string,refreshToken:string,userId:string,firstName?:string,
 *   lastName?:string,email:string,role:string,organizationId:string,
 *   organizationName:string,organizationType:string}>}
 */
export async function login(email, password) {
  const { data } = await http.post(`${PREFIX}/login`, { email, password });
  const auth = data.data;

  localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
  // Le refreshToken est désormais un token distinct et révocable : il doit être
  // conservé séparément pour permettre le renouvellement silencieux de la session.
  if (auth.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(auth));
  // Conservé pour compatibilité avec l'ancien garde de navigation.
  localStorage.setItem('isAuthenticated', 'true');

  return auth;
}

/**
 * Révoque la session côté serveur puis purge le stockage local.
 * L'échec de l'appel réseau ne doit jamais empêcher la déconnexion locale.
 */
export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (refreshToken) {
    try {
      await http.post(`${PREFIX}/logout`, { refreshToken });
    } catch {
      // Endpoint idempotent : on ignore l'erreur et on purge quand même.
    }
  }

  clearSession();
}

/** Demande l'envoi d'un code OTP à 6 chiffres, valable 15 minutes. */
export async function forgotPassword(email) {
  const { data } = await http.post(`${PREFIX}/forgot-password`, { email });
  return data.message;
}

/** Valide le code OTP et fixe le nouveau mot de passe. Révoque toutes les sessions. */
export async function resetPassword(email, otp, newPassword) {
  const { data } = await http.post(`${PREFIX}/reset-password`, { email, otp, newPassword });
  return data.message;
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY)) && getSession() !== null;
}

export const authService = {
  login,
  logout,
  forgotPassword,
  resetPassword,
  getSession,
  isAuthenticated,
};
export default authService;
