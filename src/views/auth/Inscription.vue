<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import imgcover from "../../assets/img/login-cover.jpg";
import imgcover2 from "../../assets/img/login-cover2.jpg";
import logowf from "../../assets/img/logowf.png";

const router = useRouter();

// État du formulaire actif ('pme' ou 'microfinance')
const activeForm = ref('pme');

// Variables réactives pour le formulaire PME
const pmeForm = ref({
  nom: '',
  prenom: '',
  email: ''
});

// Variables réactives pour le formulaire Micro-finance
const microfinanceForm = ref({
  nomGerant: '',
  prenomGerant: '',
  nomMicrofinance: '',
  localisation: '',
  email: ''
});

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const acceptTerms = ref(false);

// Contenu dynamique basé sur le formulaire actif
const slideContent = {
  pme: {
    image: imgcover2,
    quote: "Une plateforme intuitive qui simplifie l'accès au financement pour votre entreprise.",
    role: "Gérante PME, Yamoussoukro"
  },
  microfinance: {
    image: imgcover,
    quote: "Rejoignez des milliers d'entreprises qui font confiance à FinTrak pour leur gestion financière.",
    author: "Diabaté Mariam",
    author: "Kouamé Jean",
    role: "Directeur Micro-finance, San Pedro"
  }
};

// Fonction pour changer de formulaire
const switchForm = (formType) => {
  activeForm.value = formType;
  errorMessage.value = '';
  successMessage.value = '';
};

// Validation du formulaire PME
const handlePMERegistration = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  if (!pmeForm.value.nom || !pmeForm.value.prenom || !pmeForm.value.email) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires';
    return;
  }

  if (!acceptTerms.value) {
    errorMessage.value = 'Veuillez accepter les conditions d\'utilisation';
    return;
  }

  isLoading.value = true;

  try {
    // Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // SIMULATION - À remplacer par votre vrai backend
    // Récupérer le numéro depuis le localStorage (venant du login OTP)
    const phoneNumber = localStorage.getItem('tempPhone');
    
    const mockNewUser = {
      id: 'new-user-' + Date.now(),
      nom: pmeForm.value.nom,
      prenom: pmeForm.value.prenom,
      email: pmeForm.value.email,
      telephone: phoneNumber,
      role: 'pme'
    };

    // Sauvegarder les infos du nouvel utilisateur temporairement
    localStorage.setItem('newUser', JSON.stringify(mockNewUser));
    
    successMessage.value = 'Inscription réussie ! Créez votre code PIN...';
    
    setTimeout(() => {
      router.push('/createpin');
    }, 1500);

  } catch (error) {
    errorMessage.value = 'Une erreur est survenue lors de l\'inscription';
  } finally {
    isLoading.value = false;
  }
};

// Validation du formulaire Micro-finance
const handleMicrofinanceRequest = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  if (!microfinanceForm.value.nomGerant || !microfinanceForm.value.prenomGerant || 
      !microfinanceForm.value.nomMicrofinance || !microfinanceForm.value.localisation ||
      !microfinanceForm.value.email) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires';
    return;
  }

  if (!acceptTerms.value) {
    errorMessage.value = 'Veuillez accepter les conditions d\'utilisation';
    return;
  }

  isLoading.value = true;

  try {
    // Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // SIMULATION - À remplacer par votre vrai backend
    successMessage.value = 'Demande envoyée avec succès ! Nous vous contactons bientôt.';
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (error) {
    errorMessage.value = 'Une erreur est survenue lors de l\'envoi de la demande';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <main class="min-h-screen bg-white font-sans text-gray-800">
    <div class="flex flex-col md:flex-row">
      <!-- Image Panel - Change selon le formulaire actif -->
      <div class="relative hidden md:block md:w-2/3 overflow-hidden bg-gray-900">
        <div class="relative h-screen w-full">
          <!-- Image dynamique avec transition -->
          <transition name="slide-fade" mode="out-in">
            <div class="absolute inset-0 h-full w-full" :key="activeForm">
              <img
                :src="slideContent[activeForm].image"
                :alt="`FinTrak ${activeForm === 'pme' ? 'PME' : 'Micro-finance'}`"
                class="h-full w-full object-cover image-animate"
              />
              <!-- Gradient overlay for better text visibility -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            </div>
          </transition>
        </div>

        <!-- Contenu par-dessus l'image -->
        <div class="absolute inset-0 flex flex-col justify-between p-12 text-white z-20">
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <img class="w-6 h-6" :src="logowf" alt="">
            </div>
            <span class="text-2xl font-bold text-white">FinTrak - MF</span>
          </div>

          <!-- Citation avec transition -->
          <div class="relative">
            <transition name="fade-up" mode="out-in">
              <div
                class="quote-animate"
                :key="`quote-${activeForm}`"
              >
                <blockquote class="text-3xl font-medium leading-snug">
                  "{{ slideContent[activeForm].quote }}"
                </blockquote>
                <div class="mt-6">
                  <p class="font-semibold">{{ slideContent[activeForm].author }}</p>
                  <p class="text-sm text-gray-200">{{ slideContent[activeForm].role }}</p>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Registration Form Panel -->
      <div class="flex w-full items-center justify-center p-6 md:w-1/3 md:h-screen md:overflow-y-auto">
        <div class="w-full max-w-md my-6">
          <h1 class="text-3xl font-bold text-gray-900">Inscription</h1>
          <p class="mt-1 text-gray-600">Créez votre compte FinTrak dès maintenant.</p>

          <!-- Tabs pour choisir le type d'inscription -->
          <div class="mt-6">
            <div class="flex gap-3 p-1 bg-gray-100 rounded-lg">
              <button
                @click="switchForm('pme')"
                :class="[
                  'flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all duration-300',
                  activeForm === 'pme' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                PME
              </button>
              <button
                @click="switchForm('microfinance')"
                :class="[
                  'flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all duration-300',
                  activeForm === 'microfinance' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Micro-finance
              </button>
            </div>
          </div>

          <!-- Messages d'erreur et succès -->
          <div 
            v-if="errorMessage" 
            class="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ errorMessage }}
          </div>

          <div 
            v-if="successMessage" 
            class="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ successMessage }}
          </div>

          <!-- Formulaire PME -->
          <form 
            v-if="activeForm === 'pme'" 
            @submit.prevent="handlePMERegistration" 
            class="mt-4 space-y-4"
          >
            <!-- Note d'information -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-blue-700">
                  Votre numéro de téléphone a déjà été enregistré lors de la vérification OTP.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Nom -->
              <div>
                <label for="nom" class="block text-sm font-medium text-gray-700">
                  Nom <span class="text-red-500">*</span>
                </label>
                <div class="mt-1">
                  <input
                    id="nom"
                    v-model="pmeForm.nom"
                    type="text"
                    placeholder="Votre nom"
                    required
                    class="input-field"
                  />
                </div>
              </div>

              <!-- Prénom -->
              <div>
                <label for="prenom" class="block text-sm font-medium text-gray-700">
                  Prénom <span class="text-red-500">*</span>
                </label>
                <div class="mt-1">
                  <input
                    id="prenom"
                    v-model="pmeForm.prenom"
                    type="text"
                    placeholder="Votre prénom"
                    required
                    class="input-field"
                  />
                </div>
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email <span class="text-red-500">*</span>
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  v-model="pmeForm.email"
                  type="email"
                  placeholder="exemple@email.com"
                  required
                  class="input-field"
                />
              </div>
            </div>

            <!-- Accepter les conditions -->
            <div class="flex items-start">
              <input
                id="terms-pme"
                v-model="acceptTerms"
                type="checkbox"
                class="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="terms-pme" class="ml-2 block text-sm text-gray-700">
                J'accepte les 
                <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                  conditions d'utilisation
                </a>
                et la 
                <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                  politique de confidentialité
                </a>
              </label>
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
                {{ isLoading ? 'Inscription en cours...' : 'S\'inscrire' }}
              </button>
            </div>
          </form>

          <!-- Formulaire Micro-finance -->
          <form 
            v-if="activeForm === 'microfinance'" 
            @submit.prevent="handleMicrofinanceRequest" 
            class="mt-4 space-y-4"
          >
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-blue-700">
                  Remplissez ce formulaire pour soumettre une demande de partenariat. Notre équipe vous contactera sous 48h.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Nom du gérant -->
              <div>
                <label for="nomGerant" class="block text-sm font-medium text-gray-700">
                  Nom du gérant <span class="text-red-500">*</span>
                </label>
                <div class="mt-1">
                  <input
                    id="nomGerant"
                    v-model="microfinanceForm.nomGerant"
                    type="text"
                    placeholder="Nom"
                    required
                    class="input-field"
                  />
                </div>
              </div>

              <!-- Prénom du gérant -->
              <div>
                <label for="prenomGerant" class="block text-sm font-medium text-gray-700">
                  Prénom du gérant <span class="text-red-500">*</span>
                </label>
                <div class="mt-1">
                  <input
                    id="prenomGerant"
                    v-model="microfinanceForm.prenomGerant"
                    type="text"
                    placeholder="Prénom"
                    required
                    class="input-field"
                  />
                </div>
              </div>
            </div>

            <!-- Nom de la micro-finance -->
            <div>
              <label for="nomMicrofinance" class="block text-sm font-medium text-gray-700">
                Nom de la micro-finance <span class="text-red-500">*</span>
              </label>
              <div class="mt-1">
                <input
                  id="nomMicrofinance"
                  v-model="microfinanceForm.nomMicrofinance"
                  type="text"
                  placeholder="Ex: MicroCrédit Plus"
                  required
                  class="input-field"
                />
              </div>
            </div>

            <!-- Localisation -->
            <div>
              <label for="localisation" class="block text-sm font-medium text-gray-700">
                Localisation <span class="text-red-500">*</span>
              </label>
              <div class="mt-1">
                <input
                  id="localisation"
                  v-model="microfinanceForm.localisation"
                  type="text"
                  placeholder="Ville, Commune, Quartier"
                  required
                  class="input-field"
                />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="emailMF" class="block text-sm font-medium text-gray-700">
                Email professionnel <span class="text-red-500">*</span>
              </label>
              <div class="mt-1">
                <input
                  id="emailMF"
                  v-model="microfinanceForm.email"
                  type="email"
                  placeholder="contact@microfinance.com"
                  required
                  class="input-field"
                />
              </div>
            </div>

            <!-- Accepter les conditions -->
            <div class="flex items-start">
              <input
                id="terms-mf"
                v-model="acceptTerms"
                type="checkbox"
                class="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="terms-mf" class="ml-2 block text-sm text-gray-700">
                J'accepte les 
                <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                  conditions de partenariat
                </a>
                et consens au traitement de mes données
              </label>
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
                {{ isLoading ? 'Envoi en cours...' : 'Envoyer la demande' }}
              </button>
            </div>
          </form>

          <p class="mt-4 text-center text-sm text-gray-600">
            Vous avez déjà un compte ?
            <a href="/login" class="font-semibold text-primary-600 hover:text-primary-500">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Assurer que le contenu peut scroller */
.md\:h-screen {
  max-height: 100vh;
}

/* ===== ANIMATIONS POUR L'IMAGE ===== */

/* Animation slide-fade pour l'image */
.slide-fade-enter-active {
  transition: all 0.6s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.4s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

/* Animation supplémentaire pour l'image elle-même */
.image-animate {
  animation: zoomIn 0.8s ease-out;
}

@keyframes zoomIn {
  from {
    transform: scale(1.1);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ===== ANIMATIONS POUR LE TEXTE ===== */

/* Animation fade-up pour le texte */
.fade-up-enter-active {
  transition: all 0.5s ease-out;
  transition-delay: 0.2s;
}

.fade-up-leave-active {
  transition: all 0.3s ease-in;
}

.fade-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.fade-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Animation supplémentaire pour les citations */
.quote-animate {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.leading-snug {
  font-weight: 700;
  font-size: 40px;
}

/* Supprimer les flèches du input number */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Styles pour les champs de formulaire */
.input-field {
  display: block;
  width: 100%;
  appearance: none;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
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
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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

/* Transition smooth pour le changement de formulaire */
form {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>