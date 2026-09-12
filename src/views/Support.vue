<template>
  <div class="support-container">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Centre d'Aide & Support</h1>
      <p class="text-gray-500 mt-2">Besoin d'aide ? Nous sommes là pour vous accompagner</p>
    </div>

    <!-- Quick Actions -->
    <div v-if="isLoading">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div v-for="i in 4" :key="i" class="animate-pulse">
          <div class="card p-6">
            <div class="w-12 h-12 bg-gray-200 rounded-2xl mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div
        v-for="action in quickActions"
        :key="action.id"
        @click="handleQuickAction(action.id)"
        class="card p-6 cursor-pointer hover:shadow-xl transition-all group animate-slide-in-up"
        :style="{ animationDelay: action.delay }"
      >
        <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', action.bgColor]">
            <img :src="action.icon" alt="" />
        </div>
        <h3 class="text-sm font-bold text-gray-900 mb-1">{{ action.title }}</h3>
        <p class="text-xs text-gray-500">{{ action.description }}</p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <!-- Contact Form -->
      <div class="card">
        <div v-if="isLoading">
          <div class="animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-40 mb-6"></div>
            <div class="space-y-4">
              <div>
                <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div class="h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div>
                <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div class="h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div>
                <div class="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
              </div>
              <div class="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
        <div v-else class="animate-fade-in">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Contactez-nous</h3>
            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>En ligne</span>
            </span>
          </div>

          <form @submit.prevent="submitTicket" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Sujet</label>
              <input
                v-model="contactForm.subject"
                type="text"
                placeholder="Décrivez brièvement votre problème"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
              <select
                v-model="contactForm.category"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="technical">Problème technique</option>
                <option value="billing">Facturation</option>
                <option value="account">Compte</option>
                <option value="feature">Nouvelle fonctionnalité</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea
                v-model="contactForm.message"
                rows="5"
                placeholder="Décrivez votre problème en détail..."
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                required
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Pièces jointes (optionnel)</label>
              <div class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg class="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p class="text-sm text-gray-500"><span class="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez</p>
                    <p class="text-xs text-gray-400">PNG, JPG, PDF (MAX. 10MB)</p>
                  </div>
                  <input type="file" class="hidden" multiple accept="image/*,.pdf" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isSubmitting">Envoyer le message</span>
              <span v-else class="flex items-center justify-center space-x-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Envoi en cours...</span>
              </span>
            </button>
          </form>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSession } from '@/services/authService';

import email from '../assets/img/email.png';
import whatsapp from '../assets/img/whatsapp.png';
import Locations from '../assets/img/Locations.png';
import Share from '../assets/img/Share.png';


const isLoading = ref(false);
const isSubmitting = ref(false);
const openFaq = ref(null);

// Contact Form
const contactForm = ref({
  subject: '',
  category: '',
  message: ''
});

// Quick Actions
const quickActions = ref([
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    description: '+225 05 08 29 49 39',
    bgColor: 'bg-black',
    icon: email,
    delay: '0ms'
  },
  {
    id: 'email',
    title: 'Email',
    description: 'contact@djeli.pro',
    bgColor: 'bg-black',
    icon: whatsapp,
    delay: '100ms'
  },
  {
    id: '#',
    title: 'Lieu',
    description: 'Abidjan Cocody Angré',
    bgColor: 'bg-black',
    icon: Locations,
    delay: '200ms'
  },
  {
    id: 'website',
    title: 'Site Web',
    description: 'Visiter notre site',
    bgColor: 'bg-black',
    icon: Share,
    delay: '300ms'
  }
]);

// FAQs
const faqs = ref([
  {
    id: 1,
    question: 'Comment puis-je réinitialiser mon mot de passe ?',
    answer: 'Pour réinitialiser votre mot de passe, cliquez sur "Mot de passe oublié" sur la page de connexion. Vous recevrez un email avec un lien pour créer un nouveau mot de passe. Le lien est valide pendant 24 heures.'
  },
  {
    id: 2,
    question: 'Quels sont les modes de paiement acceptés ?',
    answer: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), Mobile Money (Orange Money, MTN, Wave, Moov) et virement bancaire. Les paiements sont sécurisés et cryptés.'
  },
  {
    id: 3,
    question: 'Comment puis-je annuler mon abonnement ?',
    answer: 'Vous pouvez annuler votre abonnement à tout moment depuis la section "Paramètres > Facturation". L\'annulation prendra effet à la fin de votre période de facturation en cours.'
  },
  {
    id: 4,
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements de plan sont calculés au prorata pour la période restante.'
  },
  {
    id: 5,
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Absolument. Nous utilisons un cryptage SSL/TLS pour toutes les communications et vos données sont stockées dans des centres de données certifiés ISO 27001. Nous effectuons également des sauvegardes quotidiennes.'
  }
]);

// Methods
const handleQuickAction = (actionId) => {
  if (actionId === 'whatsapp') {
    window.open('https://wa.me/2250508294939', '_blank');
  } else if (actionId === 'email') {
    window.location.href = 'mailto:contact@djeli.pro';
  } else if (actionId === 'faq') {
    window.open('https://sites.waretrack.online/#faq', '_blank');
  } else if (actionId === 'website') {
    window.open('https://sites.djeli.pro/', '_blank');
  }
};

/**
 * L'API ne fournit pas encore d'endpoint de ticketing : le formulaire ouvre
 * le client mail de l'utilisateur avec le contexte de session pré-rempli.
 */
const submitTicket = () => {
  isSubmitting.value = true;

  const session = getSession();
  const contexte = [
    `Établissement : ${session?.organizationName || '—'}`,
    `Utilisateur : ${session?.email || '—'}`,
    `Catégorie : ${contactForm.value.category || '—'}`,
    '',
    contactForm.value.message,
  ].join('\n');

  const sujet = encodeURIComponent(`[Djeli MF] ${contactForm.value.subject}`);
  const corps = encodeURIComponent(contexte);

  window.location.href = `mailto:contact@djeli.pro?subject=${sujet}&body=${corps}`;

  isSubmitting.value = false;
  contactForm.value = { subject: '', category: '', message: '' };
};

const toggleFaq = (faqId) => {
  openFaq.value = openFaq.value === faqId ? null : faqId;
};

onMounted(() => {
  isLoading.value = false;
});
</script>

<style scoped>
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

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>