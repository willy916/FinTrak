<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import imgcover from '../../assets/img/login-cover.jpg';
import imgcover2 from '../../assets/img/login-cover2.jpg';
import logowf from '../../assets/img/logowf.png';
import { useAuth } from '@/stores/auth';
import { extractErrorMessage } from '@/services/http';
import { forgotPassword, resetPassword } from '@/services/authService';

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberEmail = ref(true);

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

const REMEMBERED_EMAIL_KEY = 'djeli.rememberedEmail';

const canSubmit = computed(
  () => email.value.trim().length > 0 && password.value.length > 0 && !isLoading.value
);

/* ─────────────── Carrousel ─────────────── */
const currentSlide = ref(0);
const slides = [
  {
    image: imgcover,
    quote: "Une plateforme qui allie gestion et mise en relation entre commerçants et microfinance.",
    author: 'Koné Youssouf',
    role: 'Directeur Commercial, Abidjan',
  },
  {
    image: imgcover2,
    quote: "Rejoignez des milliers d'entreprises qui font confiance à Djeli pour leur gestion financière.",
    author: 'Aminata Traoré',
    role: 'Entrepreneure, Bouaké',
  },
];

let slideInterval = null;

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length;
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

onMounted(() => {
  slideInterval = setInterval(nextSlide, 5000);

  const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  if (remembered) {
    email.value = remembered;
  }
});

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval);
});

/* ─────────────── Connexion ─────────────── */
/* ─────────────── Mot de passe oublié ─────────────── */
/** Étapes : 'login' → 'forgot' (saisie e-mail) → 'reset' (code OTP + nouveau mdp). */
const step = ref('login');

const resetForm = ref({ email: '', otp: '', newPassword: '', confirmPassword: '' });
const showNewPassword = ref(false);
const resetLoading = ref(false);

function goToForgot() {
  errorMessage.value = '';
  successMessage.value = '';
  resetForm.value = { email: email.value.trim(), otp: '', newPassword: '', confirmPassword: '' };
  step.value = 'forgot';
}

function backToLogin() {
  errorMessage.value = '';
  successMessage.value = '';
  step.value = 'login';
}

/** Le serveur répond toujours 200 pour ne pas révéler l'existence d'un compte. */
async function handleForgot() {
  errorMessage.value = '';
  successMessage.value = '';

  const cleanEmail = resetForm.value.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errorMessage.value = 'Veuillez saisir une adresse e-mail valide.';
    return;
  }

  resetLoading.value = true;
  try {
    const message = await forgotPassword(cleanEmail);
    successMessage.value = message || 'Si un compte existe pour cet e-mail, un code vient d\'être envoyé.';
    resetForm.value.email = cleanEmail;
    step.value = 'reset';
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    resetLoading.value = false;
  }
}

async function handleReset() {
  errorMessage.value = '';
  successMessage.value = '';

  const { otp, newPassword, confirmPassword } = resetForm.value;

  if (!/^\d{4,10}$/.test(otp.trim())) {
    errorMessage.value = 'Le code reçu par e-mail comporte 6 chiffres.';
    return;
  }
  if (newPassword.length < 8) {
    errorMessage.value = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
    return;
  }
  if (newPassword !== confirmPassword) {
    errorMessage.value = 'Les deux mots de passe ne correspondent pas.';
    return;
  }

  resetLoading.value = true;
  try {
    await resetPassword(resetForm.value.email, otp.trim(), newPassword);
    // Toutes les sessions sont révoquées : l'utilisateur doit se reconnecter.
    email.value = resetForm.value.email;
    password.value = '';
    step.value = 'login';
    successMessage.value = 'Mot de passe réinitialisé. Connectez-vous avec vos nouveaux identifiants.';
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    resetLoading.value = false;
  }
}

/** Renvoie un nouveau code : l'ancien est automatiquement invalidé. */
async function resendCode() {
  errorMessage.value = '';
  resetLoading.value = true;
  try {
    await forgotPassword(resetForm.value.email);
    successMessage.value = 'Un nouveau code vient d\'être envoyé.';
    resetForm.value.otp = '';
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    resetLoading.value = false;
  }
}

const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  const cleanEmail = email.value.trim();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errorMessage.value = 'Veuillez saisir une adresse e-mail valide.';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères.';
    return;
  }

  isLoading.value = true;

  try {
    await login(cleanEmail, password.value);

    if (rememberEmail.value) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanEmail);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    successMessage.value = 'Connexion réussie, redirection…';

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    setTimeout(() => router.push(redirect), 600);
  } catch (error) {
    const status = error?.response?.status;
    errorMessage.value =
      status === 401 || status === 400
        ? 'E-mail ou mot de passe incorrect.'
        : extractErrorMessage(error);
    password.value = '';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <main class="min-h-screen bg-white font-sans text-gray-800">
    <div class="flex flex-col md:flex-row">
      <!-- Panneau image - Carrousel -->
      <div class="relative hidden md:block md:w-2/3 overflow-hidden bg-gray-900">
        <div class="relative h-screen w-full">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            :class="[
              'absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out',
              currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            ]"
          >
            <img :src="slide.image" alt="Djeli Dashboard" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
        </div>

        <div class="absolute inset-0 flex flex-col justify-between p-12 text-white z-20">
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <img class="w-10 h-10" :src="logowf" alt="" />
            </div>
            <span class="text-2xl font-bold text-white">Djeli Fin</span>
          </div>

          <div class="relative">
            <div
              v-for="(slide, index) in slides"
              :key="`quote-${index}`"
              :class="[
                'transition-all duration-700 ease-in-out',
                currentSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute'
              ]"
            >
              <blockquote class="text-3xl font-medium leading-snug">"{{ slide.quote }}"</blockquote>
              <div class="mt-6">
                <p class="font-semibold">{{ slide.author }}</p>
                <p class="text-sm text-gray-200">{{ slide.role }}</p>
              </div>
            </div>

            <div class="flex gap-2 mt-8">
              <button
                v-for="(slide, index) in slides"
                :key="`indicator-${index}`"
                @click="goToSlide(index)"
                :class="[
                  'h-2 rounded-full transition-all duration-300',
                  currentSlide === index ? 'w-8 bg-primary-500' : 'w-2 bg-white/50 hover:bg-white/80'
                ]"
                :aria-label="`Aller au slide ${index + 1}`"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panneau formulaire -->
      <div class="flex w-full items-center justify-center p-8 md:w-1/3">
        <div class="w-full max-w-md">
          <!-- Logo mobile -->
          <div class="flex items-center space-x-3 mb-10 md:hidden">
            <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <img class="w-10 h-10" :src="logowf" alt="" />
            </div>
            <span class="text-xl font-bold text-gray-900">Djeli - Fin</span>
          </div>

          <h1 class="text-3xl font-bold text-gray-900">
            {{ step === 'login' ? 'Connexion' : step === 'forgot' ? 'Mot de passe oublié' : 'Nouveau mot de passe' }}
          </h1>
          <p class="mt-2 text-gray-600">
            {{ step === 'login'
              ? 'Accédez à votre espace microfinance.'
              : step === 'forgot'
                ? 'Saisissez votre e-mail, nous vous enverrons un code de vérification.'
                : 'Saisissez le code reçu par e-mail et choisissez un nouveau mot de passe.' }}
          </p>

          <div
            v-if="errorMessage"
            class="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ errorMessage }}
          </div>

          <div
            v-if="successMessage"
            class="mt-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ successMessage }}
          </div>

          <form v-if="step === 'login'" @submit.prevent="handleLogin" class="mt-8 space-y-5">
            <!-- E-mail -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Adresse e-mail</label>
              <div class="mt-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="vous@microfinance.ci"
                  required
                  class="input-field pl-10"
                />
              </div>
            </div>

            <!-- Mot de passe -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
              <div class="mt-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  required
                  class="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Se souvenir -->
            <div class="flex items-center justify-between">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="rememberEmail"
                  type="checkbox"
                  class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-600">Se souvenir de mon e-mail</span>
              </label>

              <button
                type="button"
                @click="goToForgot"
                class="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <div>
              <button type="submit" :disabled="!canSubmit" class="btn-submit">
                <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isLoading ? 'Connexion…' : 'Se connecter' }}
              </button>
            </div>
          </form>

          <!-- Étape 1 : demande du code -->
          <form v-else-if="step === 'forgot'" @submit.prevent="handleForgot" class="mt-8 space-y-5">
            <div>
              <label for="resetEmail" class="block text-sm font-medium text-gray-700">Adresse e-mail</label>
              <div class="mt-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="resetEmail"
                  v-model="resetForm.email"
                  type="email"
                  autocomplete="email"
                  placeholder="vous@microfinance.ci"
                  required
                  class="input-field pl-10"
                />
              </div>
            </div>

            <button type="submit" :disabled="resetLoading" class="btn-submit">
              <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ resetLoading ? 'Envoi…' : 'Envoyer le code' }}
            </button>

            <button
              type="button"
              @click="backToLogin"
              class="w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Retour à la connexion
            </button>
          </form>

          <!-- Étape 2 : code + nouveau mot de passe -->
          <form v-else @submit.prevent="handleReset" class="mt-8 space-y-5">
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p class="text-xs text-gray-600">
                Code envoyé à <span class="font-medium text-gray-900">{{ resetForm.email }}</span>.
                Valable 15 minutes.
              </p>
            </div>

            <div>
              <label for="otp" class="block text-sm font-medium text-gray-700">Code de vérification</label>
              <input
                id="otp"
                v-model="resetForm.otp"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="10"
                placeholder="123456"
                required
                class="input-field mt-1 text-center tracking-[0.5em] font-semibold text-lg"
              />
            </div>

            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
              <div class="mt-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="newPassword"
                  v-model="resetForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="8 caractères minimum"
                  minlength="8"
                  maxlength="100"
                  required
                  class="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  :aria-label="showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <svg v-if="!showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                v-model="resetForm.confirmPassword"
                :type="showNewPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="••••••••"
                required
                class="input-field mt-1"
              />
            </div>

            <button type="submit" :disabled="resetLoading" class="btn-submit">
              <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ resetLoading ? 'Validation…' : 'Réinitialiser le mot de passe' }}
            </button>

            <div class="flex items-center justify-between">
              <button
                type="button"
                @click="resendCode"
                :disabled="resetLoading"
                class="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
              >
                Renvoyer un code
              </button>
              <button
                type="button"
                @click="backToLogin"
                class="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Retour à la connexion
              </button>
            </div>
          </form>

          <p class="mt-8 text-center text-xs text-gray-500">
            Vos identifiants sont fournis par votre administrateur Djeli.<br />
            En cas de problème,
            <a
              href="https://sites.djeli.pro/"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              contactez le support
            </a>.
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.leading-snug {
  font-weight: 700;
  font-size: 40px;
}

.input-field {
  display: block;
  width: 100%;
  appearance: none;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  color: #1f2937;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  transition: all 0.2s;
}

.input-field::placeholder {
  color: #9ca3af;
}

.input-field:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.btn-submit {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.5rem;
  background-color: #10b981;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
  background-color: #059669;
}

.btn-submit:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>