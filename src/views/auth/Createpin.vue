<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import imgcover2 from "../../assets/img/login-cover2.jpg";
import logowf from "../../assets/img/logowf.png";

const router = useRouter();

const step = ref(1); // 1: Créer PIN, 2: Confirmer PIN
const pin = ref(['', '', '', '']); // 4 digits
const confirmPin = ref(['', '', '', '']); // 4 digits
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

// Récupérer les infos de l'utilisateur nouvellement inscrit
const newUser = JSON.parse(localStorage.getItem('newUser') || '{}');

// Rediriger si pas d'infos
onMounted(() => {
  if (!newUser.id) {
    router.push('/inscription');
  }
});

// Gérer la saisie du PIN avec auto-focus (création)
const handlePinInput = (index, event) => {
  const value = event.target.value;
  
  if (value.length > 1) {
    pin.value[index] = value.slice(-1);
  }
  
  if (value && index < 3) {
    const nextInput = document.getElementById(`pin-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

// Gérer la saisie du PIN avec auto-focus (confirmation)
const handleConfirmPinInput = (index, event) => {
  const value = event.target.value;
  
  if (value.length > 1) {
    confirmPin.value[index] = value.slice(-1);
  }
  
  if (value && index < 3) {
    const nextInput = document.getElementById(`confirm-pin-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

// Gérer la touche Backspace
const handlePinKeydown = (index, event) => {
  if (event.key === 'Backspace' && !pin.value[index] && index > 0) {
    const prevInput = document.getElementById(`pin-${index - 1}`);
    if (prevInput) prevInput.focus();
  }
};

const handleConfirmPinKeydown = (index, event) => {
  if (event.key === 'Backspace' && !confirmPin.value[index] && index > 0) {
    const prevInput = document.getElementById(`confirm-pin-${index - 1}`);
    if (prevInput) prevInput.focus();
  }
};

// Gérer le collage
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
    
    const lastIndex = Math.min(digits.length - 1, 3);
    const lastInput = document.getElementById(`pin-${lastIndex}`);
    if (lastInput) lastInput.focus();
  }
};

const handleConfirmPinPaste = (event) => {
  event.preventDefault();
  const pastedData = event.clipboardData.getData('text').slice(0, 4);
  const digits = pastedData.match(/\d/g);
  
  if (digits) {
    digits.forEach((digit, index) => {
      if (index < 4) {
        confirmPin.value[index] = digit;
      }
    });
    
    const lastIndex = Math.min(digits.length - 1, 3);
    const lastInput = document.getElementById(`confirm-pin-${lastIndex}`);
    if (lastInput) lastInput.focus();
  }
};

// Créer le PIN (étape 1)
const handleCreatePin = () => {
  errorMessage.value = '';
  
  const pinCode = pin.value.join('');
  
  if (pinCode.length !== 4) {
    errorMessage.value = 'Veuillez entrer un code à 4 chiffres';
    return;
  }

  // Vérifier que ce n'est pas un code trop simple
  if (pinCode === '0000' || pinCode === '1234' || pinCode === '1111' || pinCode === '2222') {
    errorMessage.value = 'Veuillez choisir un code plus sécurisé';
    return;
  }

  step.value = 2;
  successMessage.value = '';
  setTimeout(() => {
    document.getElementById('confirm-pin-0')?.focus();
  }, 100);
};

// Confirmer le PIN (étape 2)
const handleConfirmPin = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  const pinCode = pin.value.join('');
  const confirmPinCode = confirmPin.value.join('');
  
  if (confirmPinCode.length !== 4) {
    errorMessage.value = 'Veuillez confirmer votre code à 4 chiffres';
    return;
  }

  if (pinCode !== confirmPinCode) {
    errorMessage.value = 'Les codes ne correspondent pas';
    confirmPin.value = ['', '', '', ''];
    document.getElementById('confirm-pin-0')?.focus();
    return;
  }

  isLoading.value = true;

  try {
    // Simulation d'appel API pour sauvegarder le PIN
    await new Promise(resolve => setTimeout(resolve, 1500));

    // SIMULATION - À remplacer par votre vrai backend
    // const response = await fetch('/api/auth/create-pin', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     userId: newUser.id,
    //     pin: pinCode 
    //   })
    // });

    // Simuler une réponse réussie
    const mockResponse = {
      success: true,
      token: 'new-user-token-12345'
    };

    if (mockResponse.success) {
      // Sauvegarder les données utilisateur
      localStorage.setItem('token', mockResponse.token);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Nettoyer les données temporaires
      localStorage.removeItem('newUser');
      localStorage.removeItem('tempPhone');
      
      successMessage.value = 'Code créé avec succès ! Redirection...';
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }

  } catch (error) {
    errorMessage.value = 'Erreur lors de la création du code. Veuillez réessayer.';
  } finally {
    isLoading.value = false;
  }
};

// Revenir à l'étape 1
const handleBackToCreate = () => {
  step.value = 1;
  confirmPin.value = ['', '', '', ''];
  errorMessage.value = '';
  successMessage.value = '';
};
</script>

<template>
  <main class="min-h-screen bg-white font-sans text-gray-800">
    <div class="flex flex-col md:flex-row">
      <!-- Image Panel -->
      <div class="relative hidden md:block md:w-2/3 overflow-hidden bg-gray-900">
        <div class="relative h-screen w-full">
          <img
            :src="imgcover2"
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
              "Protégez votre compte avec un code PIN personnel et sécurisé."
            </blockquote>
            <div class="mt-6">
              <p class="font-semibold">Sécurité maximale</p>
              <p class="text-sm text-gray-200">Configuration de votre code de sécurité</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PIN Creation Form Panel -->
      <div class="flex w-full items-center justify-center p-8 md:w-1/3">
        <div class="w-full max-w-md">
          <!-- Étape 1: Créer le PIN -->
          <div v-if="step === 1">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900">Créer votre code PIN</h1>
              <p class="mt-2 text-gray-600">
                Choisissez un code à 4 chiffres pour sécuriser votre compte
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

            <form @submit.prevent="handleCreatePin">
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

              <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-xs text-blue-700 font-medium mb-2">💡 Conseils :</p>
                <ul class="text-xs text-blue-600 space-y-1">
                  <li>• Choisissez un code facile à retenir</li>
                  <li>• Évitez les codes trop simples (0000, 1234, etc.)</li>
                  <li>• Ne partagez jamais votre code</li>
                </ul>
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="pin.join('').length !== 4"
                  class="btn-submit"
                >
                  Continuer
                </button>
              </div>
            </form>
          </div>

          <!-- Étape 2: Confirmer le PIN -->
          <div v-if="step === 2">
            <button 
              @click="handleBackToCreate"
              class="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>

            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900">Confirmer votre code</h1>
              <p class="mt-2 text-gray-600">
                Saisissez à nouveau votre code PIN pour le confirmer
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

            <form @submit.prevent="handleConfirmPin">
              <!-- Confirm PIN Input -->
              <div class="flex justify-center gap-4 mb-8">
                <input
                  v-for="(digit, index) in confirmPin"
                  :key="index"
                  :id="`confirm-pin-${index}`"
                  v-model="confirmPin[index]"
                  type="password"
                  inputmode="numeric"
                  maxlength="1"
                  @input="handleConfirmPinInput(index, $event)"
                  @keydown="handleConfirmPinKeydown(index, $event)"
                  @paste="handleConfirmPinPaste"
                  class="pin-input"
                  :class="{ 'pin-filled': confirmPin[index] }"
                />
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="isLoading || confirmPin.join('').length !== 4"
                  class="btn-submit"
                >
                  <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isLoading ? 'Création en cours...' : 'Créer mon code' }}
                </button>
              </div>
            </form>
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