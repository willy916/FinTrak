<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import imgcover from "../../assets/img/login-cover.jpg";
import imgcover2 from "../../assets/img/login-cover2.jpg";
import logowf from "../../assets/img/logowf.png";
import { authService } from '../../services/authServices';

const router = useRouter();

// Étapes : 1=Numéro, 2=PIN (si inscrit), 3=OTP
const step = ref(1);
const telephone = ref('');
const pin = ref(['', '', '', '']); // 4 digits pour les inscrits
const otp = ref(['', '', '', '', '', '']); // 6 digits
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isRegistered = ref(null); // true=inscrit, false=non-inscrit
const countdown = ref(60);
const canResend = ref(false);
const pinAttempts = ref(0);
const maxPinAttempts = 3;
let countdownInterval = null;

// Carrousel
const currentSlide = ref(0);
const slides = [
  {
    image: imgcover,
    quote: "Rejoignez des milliers d'entreprises qui font confiance à FinTrak pour leur gestion financière.",
    author: "Koné Youssouf",
    role: "Directeur Commercial, Abidjan"
  },
  {
    image: imgcover2,
    quote: "Une plateforme intuitive qui simplifie l'accès au financement pour votre entreprise.",
    author: "Aminata Traoré",
    role: "Entrepreneure, Bouaké"
  }
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
});

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval);
  if (countdownInterval) clearInterval(countdownInterval);
});

// Fonction pour démarrer le compte à rebours
const startCountdown = () => {
  countdown.value = 60;
  canResend.value = false;
  
  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownInterval);
      canResend.value = true;
    }
  }, 1000);
};

// Étape 1: Vérifier le numéro et déterminer si l'utilisateur est inscrit
const handleCheckPhone = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!telephone.value || telephone.value.length < 10) {
    errorMessage.value = 'Veuillez entrer un numéro de téléphone valide';
    return;
  }

  isLoading.value = true;
  
  try {

    await new Promise(resolve => setTimeout(resolve, 1000));

    // SIMULATION - À remplacer par votre vrai backend
    // Vérifier si l'utilisateur existe
    // const response = await fetch('/api/auth/check-phone', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ telephone: telephone.value })
    // });
   console.log("reponse2")
   const reponse = await authService.requestOTP(number);
    console.log("reponse", reponse)

  } catch (error) {
    errorMessage.value = 'Erreur lors de la vérification. Veuillez réessayer.';
  } finally {
    isLoading.value = false;
  }
};

// Fonction pour envoyer l'OTP
const sendOTP = async (number) => {
  try {
    // SIMULATION - À remplacer par votre vrai backend
    // await fetch('/api/auth/send-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ telephone: telephone.value })
    // });

    await authService.requestOTP(number)

    successMessage.value = 'Code de vérification envoyé !';
    step.value = 3;
    startCountdown();
    setTimeout(() => {
      document.getElementById('otp-0')?.focus();
    }, 100);
  } catch (error) {
    errorMessage.value = 'Erreur lors de l\'envoi du code.';
  }
};

// Étape 2 (pour inscrits): Vérifier le code PIN puis envoyer OTP
const handleVerifyPin = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  const pinCode = pin.value.join('');
  
  if (pinCode.length !== 4) {
    errorMessage.value = 'Veuillez entrer votre code à 4 chiffres';
    return;
  }

  isLoading.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SIMULATION - Code correct: 1234
    // const response = await fetch('/api/auth/verify-pin', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     telephone: telephone.value,
    //     pin: pinCode 
    //   })
    // });

    if (pinCode === '1234') {
      // Code PIN correct → Envoyer OTP
      successMessage.value = 'Code PIN validé !';
      await sendOTP();
    } else {
      // Code incorrect
      pinAttempts.value++;
      
      if (pinAttempts.value >= maxPinAttempts) {
        errorMessage.value = 'Trop de tentatives. Redirection...';
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        errorMessage.value = `Code incorrect. ${maxPinAttempts - pinAttempts.value} tentative(s) restante(s)`;
        pin.value = ['', '', '', ''];
        document.getElementById('pin-0')?.focus();
      }
    }

  } catch (error) {
    errorMessage.value = 'Erreur lors de la vérification du code.';
  } finally {
    isLoading.value = false;
  }
};

// Étape 3: Valider l'OTP
const handleVerifyOTP = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  const otpCode = otp.value.join('');
  
  if (otpCode.length !== 6) {
    errorMessage.value = 'Veuillez entrer le code à 6 chiffres';
    return;
  }

  isLoading.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // SIMULATION
    // const response = await fetch('/api/auth/verify-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     telephone: telephone.value,
    //     otp: otpCode 
    //   })
    // });

    // Code OTP correct: 123456
    if (otpCode === '123456') {
      if (isRegistered.value) {
        // Utilisateur inscrit → Connexion réussie → Dashboard
        const mockData = {
          token: 'token-12345',
          user: {
            id: '1',
            telephone: telephone.value,
            nom: 'Ouattara',
            prenom: 'Wilfried',
            role: 'pme'
          }
        };

        localStorage.setItem('token', mockData.token);
        localStorage.setItem('user', JSON.stringify(mockData.user));
        localStorage.setItem('isAuthenticated', 'true');
        
        successMessage.value = 'Connexion réussie !';
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        
      } else {
        // Utilisateur non-inscrit → Inscription
        successMessage.value = 'Vérification réussie ! Complétez votre inscription.';
        localStorage.setItem('tempPhone', telephone.value);
        
        setTimeout(() => {
          router.push('/inscription');
        }, 1500);
      }
    } else {
      throw new Error('Code incorrect');
    }

  } catch (error) {
    errorMessage.value = 'Code invalide. Veuillez réessayer.';
    otp.value = ['', '', '', '', '', ''];
    document.getElementById('otp-0')?.focus();
  } finally {
    isLoading.value = false;
  }
};

// Renvoyer le code OTP
const handleResendOTP = async () => {
  if (!canResend.value) return;
  
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    successMessage.value = 'Code renvoyé avec succès !';
    startCountdown();
  } catch (error) {
    errorMessage.value = 'Erreur lors du renvoi du code.';
  } finally {
    isLoading.value = false;
  }
};

// Gestion des inputs PIN
const handlePinInput = (index, event) => {
  const value = event.target.value;
  if (value.length > 1) {
    pin.value[index] = value.slice(-1);
  }
  if (value && index < 3) {
    document.getElementById(`pin-${index + 1}`)?.focus();
  }
};

const handlePinKeydown = (index, event) => {
  if (event.key === 'Backspace' && !pin.value[index] && index > 0) {
    document.getElementById(`pin-${index - 1}`)?.focus();
  }
};

const handlePinPaste = (event) => {
  event.preventDefault();
  const pastedData = event.clipboardData.getData('text').slice(0, 4);
  const digits = pastedData.match(/\d/g);
  if (digits) {
    digits.forEach((digit, index) => {
      if (index < 4) pin.value[index] = digit;
    });
    const lastIndex = Math.min(digits.length - 1, 3);
    document.getElementById(`pin-${lastIndex}`)?.focus();
  }
};

// Gestion des inputs OTP
const handleOtpInput = (index, event) => {
  const value = event.target.value;
  if (value.length > 1) {
    otp.value[index] = value.slice(-1);
  }
  if (value && index < 5) {
    document.getElementById(`otp-${index + 1}`)?.focus();
  }
};

const handleOtpKeydown = (index, event) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    document.getElementById(`otp-${index - 1}`)?.focus();
  }
};

const handleOtpPaste = (event) => {
  event.preventDefault();
  const pastedData = event.clipboardData.getData('text').slice(0, 6);
  const digits = pastedData.match(/\d/g);
  if (digits) {
    digits.forEach((digit, index) => {
      if (index < 6) otp.value[index] = digit;
    });
    const lastIndex = Math.min(digits.length - 1, 5);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  }
};

// Retour aux étapes précédentes
const handleBackToPhone = () => {
  step.value = 1;
  pin.value = ['', '', '', ''];
  otp.value = ['', '', '', '', '', ''];
  isRegistered.value = null;
  pinAttempts.value = 0;
  errorMessage.value = '';
  successMessage.value = '';
  if (countdownInterval) clearInterval(countdownInterval);
};

const handleBackToPin = () => {
  step.value = 2;
  otp.value = ['', '', '', '', '', ''];
  errorMessage.value = '';
  successMessage.value = '';
  if (countdownInterval) clearInterval(countdownInterval);
};
</script>

<template>
  <main class="min-h-screen bg-white font-sans text-gray-800">
    <div class="flex flex-col md:flex-row">
      <!-- Image Panel - Carrousel -->
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
            <img
              :src="slide.image"
              alt="FinTrak Dashboard"
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
        </div>

        <div class="absolute inset-0 flex flex-col justify-between p-12 text-white z-20">
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <img class="w-6 h-6" :src="logowf" alt="">
            </div>
            <span class="text-2xl font-bold text-white">FinTrak - MF</span>
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
              <blockquote class="text-3xl font-medium leading-snug">
                "{{ slide.quote }}"
              </blockquote>
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

      <!-- Login Form Panel -->
      <div class="flex w-full items-center justify-center p-8 md:w-1/3">
        <div class="w-full max-w-md">
          <!-- Étape 1: Saisie du numéro de téléphone -->
          <div v-if="step === 1">
            <h1 class="text-3xl font-bold text-gray-900">Connexion</h1>
            <p class="mt-2 text-gray-600">Entrez votre numéro pour continuer.</p>

            <div 
              v-if="errorMessage" 
              class="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ errorMessage }}
            </div>

            <form @submit.prevent="handleCheckPhone" class="mt-8 space-y-6">
              <div>
                <label for="telephone" class="block text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </label>
                <div class="mt-1 relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="telephone"
                    v-model="telephone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    required
                    class="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="btn-submit"
                >
                  <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isLoading ? 'Vérification...' : 'Continuer' }}
                </button>
              </div>
            </form>

            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-xs text-blue-700 font-medium mb-2">💡 Mode Test :</p>
              <p class="text-xs text-blue-600">
                • Numéro inscrit : <strong>+225 0123456789</strong><br>
                • Autres numéros : Non-inscrits
              </p>
            </div>
          </div>

          <!-- Étape 2: Saisie du code PIN (utilisateurs inscrits uniquement) -->
          <div v-if="step === 2">
            <button 
              @click="handleBackToPhone"
              class="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>

            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900">Code de sécurité</h1>
              <p class="mt-2 text-gray-600">
                Entrez votre code PIN à 4 chiffres
              </p>
            </div>

            <div 
              v-if="errorMessage" 
              class="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ errorMessage }}
            </div>

            <div 
              v-if="successMessage" 
              class="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ successMessage }}
            </div>

            <form @submit.prevent="handleVerifyPin">
              <div class="flex justify-center gap-4 mb-8">
                <input
                  v-for="(digit, index) in pin"
                  :key="index"
                  :id="`pin-${index}`"
                  v-model="pin[index]"
                  type="password"
                  inputmode="numeric"
                  maxlength="1"
                  @input="handlePinInput(index, $event)"
                  @keydown="handlePinKeydown(index, $event)"
                  @paste="handlePinPaste"
                  class="pin-input"
                  :class="{ 'pin-filled': pin[index] }"
                />
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="isLoading || pin.join('').length !== 4"
                  class="btn-submit"
                >
                  <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isLoading ? 'Vérification...' : 'Continuer' }}
                </button>
              </div>
            </form>

            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-xs text-blue-700 font-medium mb-2">💡 Mode Test :</p>
              <p class="text-xs text-blue-600">
                Code PIN : <strong>1234</strong><br>
                Maximum 3 tentatives
              </p>
            </div>
          </div>

          <!-- Étape 3: Validation du code OTP -->
          <div v-if="step === 3">
            <button 
              @click="isRegistered ? handleBackToPin() : handleBackToPhone()"
              class="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>

            <h1 class="text-3xl font-bold text-gray-900">Vérification OTP</h1>
            <p class="mt-2 text-gray-600">
              Entrez le code à 6 chiffres envoyé au<br>
              <span class="font-semibold text-gray-900">{{ telephone }}</span>
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

            <form @submit.prevent="handleVerifyOTP" class="mt-8">
              <div class="flex justify-center gap-3 mb-8">
                <input
                  v-for="(digit, index) in otp"
                  :key="index"
                  :id="`otp-${index}`"
                  v-model="otp[index]"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  @input="handleOtpInput(index, $event)"
                  @keydown="handleOtpKeydown(index, $event)"
                  @paste="handleOtpPaste"
                  class="otp-input"
                  :class="{ 'otp-filled': otp[index] }"
                />
              </div>

              <div class="text-center mb-6">
                <p class="text-sm text-gray-600 mb-2">
                  Vous n'avez pas reçu le code ?
                </p>
                <button
                  type="button"
                  @click="handleResendOTP"
                  :disabled="!canResend || isLoading"
                  class="text-sm font-semibold transition-colors"
                  :class="canResend ? 'text-primary-600 hover:text-primary-500' : 'text-gray-400 cursor-not-allowed'"
                >
                  {{ canResend ? 'Renvoyer le code' : `Renvoyer dans ${countdown}s` }}
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="isLoading || otp.join('').length !== 6"
                  class="btn-submit"
                >
                  <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isLoading ? 'Vérification...' : 'Vérifier' }}
                </button>
              </div>
            </form>

            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-xs text-blue-700 font-medium mb-2">💡 Mode Test :</p>
              <p class="text-xs text-blue-600">
                Code OTP : <strong>123456</strong>
              </p>
            </div>
          </div>
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

/* Styles pour les champs de formulaire */
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

/* Styles pour les inputs PIN */
.pin-input {
  width: 4rem;
  height: 4.5rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
  border: 2px solid #d1d5db;
  border-radius: 0.75rem;
  transition: all 0.2s;
  color: #1f2937;
}

.pin-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.pin-input.pin-filled {
  border-color: #10b981;
  background-color: #f0fdf4;
}

/* Styles pour les inputs OTP */
.otp-input {
  width: 3rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.2s;
  color: #1f2937;
}

.otp-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.otp-input.otp-filled {
  border-color: #10b981;
  background-color: #f0fdf4;
}

/* Bouton de soumission avec couleur FinTrak */
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

/* Animation de rotation pour le spinner */
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


