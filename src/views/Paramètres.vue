<template>
  <div class="settings-container">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Paramètres du Compte</h1>
      <p class="text-gray-500 mt-2">Gérez vos préférences et paramètres de sécurité</p>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar Navigation -->
      <div class="lg:col-span-1">
        <div class="card sticky top-6">
          <!-- General Settings -->
          <div class="mb-6">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Paramètres Généraux</p>
            <nav class="space-y-1">
              <button
                v-for="item in generalMenu"
                :key="item.id"
                @click="changeSection(item.id)"
                :class="[
                  'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeSection === item.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                ]"
              >
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
              </button>
            </nav>
          </div>

          <!-- Workspace Settings -->
          <div class="pt-6 border-t border-gray-100">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Espace de Travail</p>
            <nav class="space-y-1">
              <button
                v-for="item in workspaceMenu"
                :key="item.id"
                @click="changeSection(item.id)"
                :class="[
                  'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeSection === item.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                ]"
              >
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="lg:col-span-3">
        <!-- Account Section -->
        <div v-if="activeSection === 'account'" class="space-y-6">
          <!-- My Profile -->
          <div class="card">
            <div v-if="isSectionLoading">
              <!-- Profile Skeleton -->
              <div class="animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                
                <div class="flex items-start space-x-6 mb-8">
                  <div class="w-24 h-24 bg-gray-200 rounded-2xl"></div>
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                      <div class="h-10 bg-gray-200 rounded-xl w-32"></div>
                      <div class="h-10 bg-gray-200 rounded-xl w-24"></div>
                    </div>
                    <div class="h-3 bg-gray-200 rounded w-64"></div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div class="h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div>
                    <div class="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div class="h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>

                <div class="flex justify-end mt-6">
                  <div class="h-12 bg-gray-200 rounded-xl w-48"></div>
                </div>
              </div>
            </div>
            <div v-else class="animate-fade-in">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Mon Profil</h3>
              
              <!-- Profile Picture -->
              <div class="flex items-start space-x-6 mb-8">
                <div class="relative group">
                  <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {{ userInitials }}
                  </div>
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-2xl transition-all flex items-center justify-center cursor-pointer">
                    <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <button class="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium">
                      Changer l'image
                    </button>
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium">
                      Supprimer
                    </button>
                  </div>
                  <p class="text-xs text-gray-500">Formats supportés: PNG, JPG, GIF (max 2MB)</p>
                </div>
              </div>

              <!-- Name Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                  <input
                    v-model="profile.firstName"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                  <input
                    v-model="profile.lastName"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div class="flex justify-end mt-6">
                <button class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>

          <!-- Account Security -->
          <div class="card">
            <div v-if="isSectionLoading">
              <!-- Security Skeleton -->
              <div class="animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-40 mb-6"></div>

                <div class="mb-6">
                  <div class="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div class="flex items-center space-x-3">
                    <div class="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                    <div class="h-12 bg-gray-200 rounded-xl w-24"></div>
                  </div>
                </div>

                <div class="mb-6">
                  <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div class="flex items-center space-x-3">
                    <div class="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                    <div class="h-12 bg-gray-200 rounded-xl w-24"></div>
                  </div>
                </div>

                <div class="flex items-start justify-between p-4 bg-gray-100 rounded-xl">
                  <div class="flex-1">
                    <div class="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-64"></div>
                  </div>
                  <div class="w-11 h-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <div v-else class="animate-fade-in">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Sécurité du Compte</h3>

              <!-- Email -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="security.email"
                    type="email"
                    disabled
                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <button class="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
                    Modifier
                  </button>
                </div>
              </div>

              <!-- Password -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                <div class="flex items-center space-x-3">
                  <input
                    type="password"
                    value="••••••••••"
                    disabled
                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <button class="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
                    Modifier
                  </button>
                </div>
              </div>

              <!-- 2FA -->
              <div class="flex items-start justify-between p-4 bg-gray-50 rounded-xl mb-6">
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-gray-900 mb-1">Authentification à deux facteurs</h4>
                  <p class="text-xs text-gray-500">Ajoutez une couche de sécurité supplémentaire à votre compte</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="security.twoFactorEnabled" type="checkbox" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <!-- Log out all devices -->
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-gray-900 mb-1">Se déconnecter de tous les appareils</h4>
                  <p class="text-xs text-gray-500">Déconnectez toutes les sessions actives sur les autres appareils</p>
                </div>
                <button class="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
                  Déconnecter
                </button>
              </div>

              <!-- Delete Account -->
              <div class="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-red-900 mb-1">Supprimer mon compte</h4>
                  <p class="text-xs text-red-600">Supprimez définitivement votre compte et toutes vos données</p>
                </div>
                <button class="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-medium">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Microfinance Settings Section -->
        <div v-if="activeSection === 'microfinance-settings'" class="space-y-6">
          <div class="card">
            <div v-if="isSectionLoading">
              <!-- Microfinance Settings Skeleton -->
              <div class="animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-64 mb-6"></div>
                <div class="space-y-4">
                  <div v-for="i in 6" :key="i">
                    <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div class="h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="animate-fade-in">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Paramétrage de la Microfinance</h3>
              <p class="text-sm text-gray-500 mb-6">Configurez les informations de votre microfinance</p>

              <!-- Nom de la Microfinance -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nom de la Microfinance</label>
                <input
                  v-model="microfinanceSettings.name"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Ex: FinanceCI Microfinance"
                />
              </div>

              <!-- Description -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description de la Microfinance</label>
                <textarea
                  v-model="microfinanceSettings.description"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Décrivez brièvement votre microfinance et ses services..."
                ></textarea>
              </div>

              <!-- Spécialités -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Spécialités / Domaines d'investissement</label>
                <p class="text-xs text-gray-500 mb-3">Sélectionnez les secteurs dans lesquels vous investissez</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    v-for="specialty in availableSpecialties"
                    :key="specialty"
                    class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      :value="specialty"
                      v-model="microfinanceSettings.specialties"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm text-gray-700">{{ specialty }}</span>
                  </label>
                  <!-- Autre option -->
                  <div class="col-span-full">
                    <input
                      v-model="microfinanceSettings.otherSpecialty"
                      type="text"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Autre spécialité (préciser)"
                    />
                  </div>
                </div>
              </div>

              <!-- Conditions Requises -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Conditions Requises</label>
                <p class="text-xs text-gray-500 mb-3">Conditions pour obtenir un financement chez votre microfinance</p>
                <div class="space-y-2">
                  <label
                    v-for="condition in availableConditions"
                    :key="condition"
                    class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      :value="condition"
                      v-model="microfinanceSettings.requiredConditions"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm text-gray-700">{{ condition }}</span>
                  </label>
                  <!-- Autre condition -->
                  <input
                    v-model="microfinanceSettings.otherCondition"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Autre condition (préciser)"
                  />
                </div>
              </div>

              <!-- Documents Minimum -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Documents Minimum à Fournir</label>
                <p class="text-xs text-gray-500 mb-3">Documents que les PME doivent fournir</p>
                <div class="space-y-2">
                  <label
                    v-for="document in availableDocuments"
                    :key="document"
                    class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      :value="document"
                      v-model="microfinanceSettings.requiredDocuments"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm text-gray-700">{{ document }}</span>
                  </label>
                  <!-- Autre document -->
                  <input
                    v-model="microfinanceSettings.otherDocument"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Autre document (préciser)"
                  />
                </div>
              </div>

              <!-- Taux d'intérêt et Délai -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Taux d'Intérêt Minimum (%)</label>
                  <input
                    v-model.number="microfinanceSettings.minInterestRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Ex: 5.5"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Délai Minimum de Réponse</label>
                  <select
                    v-model="microfinanceSettings.responseDelay"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sélectionner un délai</option>
                    <option value="24h">24 heures</option>
                    <option value="48h">48 heures</option>
                    <option value="72h">72 heures</option>
                    <option value="1-week">1 semaine</option>
                    <option value="2-weeks">2 semaines</option>
                    <option value="1-month">1 mois</option>
                  </select>
                </div>
              </div>

              <!-- Coordonnées -->
              <div class="border-t border-gray-200 pt-6 mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4">Coordonnées</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Numéro Joignable</label>
                    <input
                      v-model="microfinanceSettings.contact.phone"
                      type="tel"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="+225 07 00 00 00 00"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      v-model="microfinanceSettings.contact.email"
                      type="email"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="contact@microfinance.ci"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Localisation</label>
                  <input
                    v-model="microfinanceSettings.contact.location"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Ex: Abidjan, Plateau"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications Section -->
        <div v-if="activeSection === 'notifications'" class="card">
          <div v-if="isSectionLoading">
            <!-- Notifications Skeleton -->
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 rounded w-48 mb-6"></div>

              <div class="space-y-4">
                <div v-for="i in 4" :key="i" class="flex items-start justify-between p-4 bg-gray-100 rounded-xl">
                  <div class="flex items-start space-x-4 flex-1">
                    <div class="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div class="flex-1">
                      <div class="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                      <div class="h-3 bg-gray-200 rounded w-64"></div>
                    </div>
                  </div>
                  <div class="w-11 h-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              <div class="flex justify-end mt-6">
                <div class="h-12 bg-gray-200 rounded-xl w-48"></div>
              </div>
            </div>
          </div>
          <div v-else class="animate-fade-in">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Préférences de Notification</h3>

            <div class="space-y-4">
              <div v-for="notif in notificationSettings" :key="notif.id" class="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <div class="flex items-start space-x-4">
                  <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', notif.bgColor]">
                    <svg :class="['w-6 h-6', notif.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="notif.iconPath" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="text-sm font-semibold text-gray-900 mb-1">{{ notif.title }}</h4>
                    <p class="text-xs text-gray-500">{{ notif.description }}</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="notif.enabled" type="checkbox" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            <div class="flex justify-end mt-6">
              <button class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>

        <!-- Language Section -->
        <div v-if="activeSection === 'language'" class="card">
          <div v-if="isSectionLoading">
            <!-- Language Skeleton -->
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 rounded w-40 mb-6"></div>

              <div class="mb-6">
                <div class="h-4 bg-gray-200 rounded w-36 mb-3"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="i in 4" :key="i" class="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200">
                    <div class="w-8 h-8 bg-gray-200 rounded"></div>
                    <div class="flex-1">
                      <div class="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div class="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <div class="h-12 bg-gray-200 rounded-xl w-48"></div>
              </div>
            </div>
          </div>
          <div v-else class="animate-fade-in">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Langue & Région</h3>

            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-3">Langue de l'interface</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  v-for="lang in languages"
                  :key="lang.code"
                  @click="selectedLanguage = lang.code"
                  :class="[
                    'flex items-center space-x-3 p-4 rounded-xl border-2 transition-all',
                    selectedLanguage === lang.code
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  <span class="text-2xl">{{ lang.flag }}</span>
                  <div class="flex-1 text-left">
                    <p class="text-sm font-semibold text-gray-900">{{ lang.name }}</p>
                    <p class="text-xs text-gray-500">{{ lang.nativeName }}</p>
                  </div>
                  <div v-if="selectedLanguage === lang.code" class="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div class="flex justify-end">
              <button class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>

        <!-- Payment Accounts Section -->
        <div v-if="activeSection === 'payment'" class="card">
          <div v-if="isSectionLoading">
            <!-- Payment Accounts Skeleton -->
            <div class="animate-pulse">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <div class="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div class="h-4 bg-gray-200 rounded w-64"></div>
                </div>
                <div class="h-10 bg-gray-200 rounded-xl w-40"></div>
              </div>

              <div class="space-y-3">
                <div v-for="i in 3" :key="i" class="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div>
                      <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div class="h-3 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div class="w-9 h-9 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="animate-fade-in">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Comptes de Paiement</h3>
                <p class="text-sm text-gray-500 mt-1">Ajoutez vos numéros pour recevoir de l'argent</p>
              </div>
              <button @click="showAddPaymentModal = true" class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all text-sm font-semibold flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Ajouter un compte</span>
              </button>
            </div>

            <!-- Payment Accounts List -->
            <div class="space-y-3">
              <div v-if="paymentAccounts.length === 0" class="text-center py-16">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-gray-500 text-sm">Aucun compte de paiement ajouté</p>
                <p class="text-gray-400 text-xs mt-1">Ajoutez un numéro pour recevoir vos paiements</p>
              </div>

              <div v-for="account in paymentAccounts" :key="account.id" class="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                <div class="flex items-center space-x-4">
                  <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', account.color]">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="account.iconPath" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-gray-900">{{ account.provider }}</h4>
                    <p class="text-xs text-gray-500">{{ account.number }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <span v-if="account.isDefault" class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Par défaut
                  </span>
                  <button v-else @click="setDefaultAccount(account.id)" class="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-300 transition-colors opacity-0 group-hover:opacity-100">
                    Définir par défaut
                  </button>
                  <button @click="deletePaymentAccount(account.id)" class="p-2 hover:bg-red-100 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Payment Modal -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showAddPaymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="showAddPaymentModal = false">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Ajouter un compte de paiement</h3>
            <button @click="showAddPaymentModal = false" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Provider Selection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Opérateur</label>
              <select v-model="newAccount.provider" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                <option value="">Sélectionner un opérateur</option>
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Mobile Money">MTN Mobile Money</option>
                <option value="Wave">Wave</option>
                <option value="Moov Money">Moov Money</option>
              </select>
            </div>

            <!-- Phone Number -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Numéro de téléphone</label>
              <input
                v-model="newAccount.number"
                type="tel"
                placeholder="+225 07 00 00 00 00"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <!-- Set as Default -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h4 class="text-sm font-semibold text-gray-900">Définir par défaut</h4>
                <p class="text-xs text-gray-500">Utiliser ce compte pour les paiements</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="newAccount.isDefault" type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div class="flex items-center space-x-3 mt-6">
            <button @click="showAddPaymentModal = false" class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium">
              Annuler
            </button>
            <button @click="addPaymentAccount" class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold">
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Icons as inline components
const UserIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>' };
const SettingsIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>' };
const BellIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>' };
const GlobeIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' };
const WalletIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>' };

const isSectionLoading = ref(false);
const activeSection = ref('account');
const showAddPaymentModal = ref(false);

// Profile Data
const profile = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
});

const userInitials = computed(() => {
  return (profile.value.firstName.charAt(0) + profile.value.lastName.charAt(0)).toUpperCase();
});

// Security Settings
const security = ref({
  email: 'john.doe@example.com',
  twoFactorEnabled: true
});

// Microfinance Settings
const microfinanceSettings = ref({
  name: '',
  description: '',
  specialties: [],
  otherSpecialty: '',
  requiredConditions: [],
  otherCondition: '',
  requiredDocuments: [],
  otherDocument: '',
  minInterestRate: null,
  responseDelay: '',
  contact: {
    phone: '',
    email: '',
    location: ''
  }
});

// Available options
const availableSpecialties = [
  'Agriculture',
  'Commerce',
  'Technologie',
  'Industrie',
  'Artisanat',
  'Services',
  'Transport',
  'Santé',
  'Éducation',
  'Immobilier'
];

const availableConditions = [
  '2 ans d\'activité minimum',
  'Chiffre d\'affaires > 10M FCFA',
  'Garanties personnelles ou matérielles',
  'Documents administratifs à jour',
  'Plan d\'affaires détaillé',
  'Attestation fiscale',
  'Compte bancaire professionnel'
];

const availableDocuments = [
  'Pièce d\'identité du dirigeant',
  'Registre de commerce',
  'Attestation fiscale',
  'Bilan financier',
  'États financiers (3 derniers mois)',
  'Business plan',
  'Justificatif de domicile',
  'Attestation bancaire'
];

// Menu Items
const generalMenu = [
  { id: 'account', label: 'Compte', icon: UserIcon },
  { id: 'microfinance-settings', label: 'Paramétrage du compte', icon: SettingsIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'language', label: 'Langue & Région', icon: GlobeIcon }
];

const workspaceMenu = [
  { id: 'payment', label: 'Comptes de paiement', icon: WalletIcon }
];

// Change Section with Loading
const changeSection = (sectionId) => {
  isSectionLoading.value = true;
  activeSection.value = sectionId;
  
  setTimeout(() => {
    isSectionLoading.value = false;
  }, 800);
};

// Notification Settings with Icons
const notificationSettings = ref([
  { 
    id: 1, 
    title: 'Notifications par email', 
    description: 'Recevez des emails pour les activités importantes', 
    enabled: true, 
    bgColor: 'bg-blue-100', 
    iconColor: 'text-blue-600',
    iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  },
  { 
    id: 2, 
    title: 'Notifications push', 
    description: 'Recevez des notifications sur votre appareil', 
    enabled: false, 
    bgColor: 'bg-purple-100', 
    iconColor: 'text-purple-600',
    iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
  },
  { 
    id: 3, 
    title: 'Rapports hebdomadaires', 
    description: 'Résumé de votre activité chaque semaine', 
    enabled: true, 
    bgColor: 'bg-green-100', 
    iconColor: 'text-green-600',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  { 
    id: 4, 
    title: 'Notifications de succès', 
    description: 'Soyez notifié des actions réussies', 
    enabled: true, 
    bgColor: 'bg-emerald-100', 
    iconColor: 'text-emerald-600',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  }
]);

// Languages
const languages = ref([
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
]);

const selectedLanguage = ref('fr');

// Payment Accounts
const paymentAccounts = ref([
  { 
    id: 1, 
    provider: 'Orange Money', 
    number: '+225 07 12 34 56 78', 
    isDefault: true,
    color: 'bg-orange-500',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  { 
    id: 2, 
    provider: 'MTN Mobile Money', 
    number: '+225 05 98 76 54 32', 
    isDefault: false,
    color: 'bg-yellow-500',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
  }
]);

const newAccount = ref({
  provider: '',
  number: '',
  isDefault: false
});

const addPaymentAccount = () => {
  if (!newAccount.value.provider || !newAccount.value.number) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // Si nouveau compte est par défaut, retirer le défaut des autres
  if (newAccount.value.isDefault) {
    paymentAccounts.value.forEach(acc => acc.isDefault = false);
  }

  paymentAccounts.value.push({
    id: Date.now(),
    provider: newAccount.value.provider,
    number: newAccount.value.number,
    isDefault: newAccount.value.isDefault,
    color: randomColor,
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  });

  // Reset form
  newAccount.value = { provider: '', number: '', isDefault: false };
  showAddPaymentModal.value = false;
};

const setDefaultAccount = (accountId) => {
  paymentAccounts.value.forEach(acc => {
    acc.isDefault = acc.id === accountId;
  });
};

const deletePaymentAccount = (accountId) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce compte de paiement ?')) {
    const index = paymentAccounts.value.findIndex(acc => acc.id === accountId);
    if (index > -1) {
      paymentAccounts.value.splice(index, 1);
    }
  }
};

onMounted(() => {
  // Initial section is already loaded
  isSectionLoading.value = false;
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}
</style>