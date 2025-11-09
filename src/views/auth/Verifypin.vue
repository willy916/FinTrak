<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import imgcover from "../../assets/img/login-cover.jpg";
import logowf from "../../assets/img/logowf.png";

const router = useRouter();

const pin = ref(['', '', '', '']); // 4 digits
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const attempts = ref(0);
const maxAttempts = 3;

// Récupérer les infos temporaires
const tempUser = JSON.parse(localStorage.getItem('tempUser') || '{}');
const tempToken = localStorage.getItem('tempToken');

// Rediriger si pas d'infos temporaires
onMounted(() => {
  if (!tempUser.id || !tempToken) {
    router.push('/login');
  }
});

// Gérer la saisie du PIN avec auto-focus
const handlePinInput = (index, event) => {
  const value = event.target.value;
  
  // Ne garder que le dernier chiffre saisi
  if (value.length > 1) {
    pin.value[index] = value.slice(-1);
  }
  
  // Passer au champ suivant si un chiffre est saisi
  if (value && index < 3) {
    const nextInput = document.getElementById(`pin-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

// Gérer la touche Backspace pour revenir au champ précédent
const handlePinKeydown = (index, event) => {
  if (event.key === 'Backspace' && !pin.value[index] && index > 0) {
    const prevInput = document.getElementById(`pin-${index - 1}`);
    if (prevInput) prevInput.focus();
  }
};

// Gérer le collage du code PIN
const handlePinPaste = (event) => {
  event.preventDefault();
  const pastedData = event.clipboardData.getData('text').slice(0, 4);
  const digits = pastedData.match(/\d/g);
  
  if (digits) {
    digits.forEach((digit, index) => {
      if (index < 4) {
        pin.value[index] = digit;
      }
    });
    
    // Focus sur le dernier champ rempli
    const lastIndex = Math.min(digits.length - 1, 3);
    const lastInput = document.getElementById(`pin-${lastIndex}`);
    if (lastInput) lastInput.focus();
  }
};

// Vérifier le code PIN
const handleVerifyPin = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  const pinCode = pin.value.join('');
  
  // Validation
  if (pinCode.length !== 4) {
    errorMessage.value = 'Veuillez entrer votre code à 4 chiffres';
    return;
  }

  isLoading.value = true;

  try {
    // Simulation d'appel API pour vérifier le PIN
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SIMULATION - À remplacer par votre vrai backend
    // const response = await fetch('/api/auth/verify-pin', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     userId: tempUser.id,
    //     pin: pinCode 
    //   })
    // });

    // SIMULATION: le code correct est '1234'
    if (pinCode === '1234') {
      // Code correct -> Connexion réussie
      localStorage.setItem('token', tempToken);
      localStorage.setItem('user', JSON.stringify(tempUser));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Nettoyer les données temporaires
      localStorage.removeItem('tempUser');
      localStorage.removeItem('tempToken');
      
      successMessage.value = 'Connexion réussie !';
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } else {
      // Code incorrect
      attempts.value++;
      
      if (attempts.value >= maxAttempts) {
        errorMessage.value = `Code incorrect. Trop de tentatives. Redirection...`;
        
        // Nettoyer et rediriger vers le login
        localStorage.removeItem('tempUser');
        localStorage.removeItem('tempToken');
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        
      } else {
        errorMessage.value = `Code incorrect. ${maxAttempts - attempts.value} tentative(s) restante(s)`;
        // Réinitialiser le PIN
        pin.value = ['', '', '', ''];
        document.getElementById('pin-0')?.focus();
      }
    }

  } catch (error) {
    errorMessage.value = 'Erreur lors de la vérification. Veuillez réessayer.';
    pin.value = ['', '', '', ''];
    document.getElementById('pin-0')?.focus();
  } finally {
    isLoading.value = false;
  }
};

// Fonction pour oublier le code PIN
const handleForgotPin = () => {
  // Nettoyer et rediriger vers le login
  localStorage.removeItem('tempUser');
  localStorage.removeItem('tempToken');
  router.push('/login');
};
</script>

<template>
  <main class="min-h-screen bg-white font-sans text-gray-800">
    <div class="flex flex-col md:flex-row">
      <!-- Image Panel -->
      <div class="relative hidden md:block md:w-2/3 overflow-hidden bg-gray-900">
        <div class="relative h-screen w-full">
          <img
            :src="imgcover"
            alt="FinTrak Dashboard"
            class="h-full w-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>

        <!-- Contenu par-dessus l'image -->
        <div class="absolute inset-0 flex flex-col justify-between p-12 text-white z-20">
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <img class="w-6 h-6" :src="logowf" alt="">
            </div>
            <span class="text-2xl font-bold text-white">FinTrak</span>
          </div>

          <div>
            <blockquote class="text-3xl font-medium leading-snug">
              "Votre sécurité est notre priorité. Accédez à votre compte en toute confiance."
            </blockquote>
            <div class="mt-6">
              <p class="font-semibold">Sécurité renforcée</p>
              <p class="text-sm text-gray-200">Authentification à deux facteurs</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PIN Form Panel -->
      <div class="flex w-full items-center justify-center p-8 md:w-1/3">
        <div class="w-full max-w-md">
          <button 
            @click="handleForgotPin"
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
              Bonjour <span class="font-semibold text-gray-900">{{ tempUser.prenom }}</span>,<br>
              entrez votre code PIN à 4 chiffres
            </p>
          </div>

          <!-- Messages -->
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
            <!-- PIN Input -->
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
                {{ isLoading ? 'Vérification...' : 'Se connecter' }}
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <button
              type="button"
              @click="handleForgotPin"
              class="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Code oublié ?
            </button>
          </div>

          <!-- Info de test -->
          <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-xs text-blue-700 font-medium mb-2">💡 Mode Test :</p>
            <p class="text-xs text-blue-600">
              Code PIN de test : <strong>1234</strong><br>
              Maximum 3 tentatives
            </p>
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