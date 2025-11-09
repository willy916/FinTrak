<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar 
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileSidebarOpen"
      @toggle-collapse="toggleSidebar"
      @close-mobile="closeMobileSidebar"
    />

    <!-- Main Content Area -->
    <div 
      class="flex-1 flex flex-col overflow-hidden transition-all duration-300"
      :class="[
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      ]"
    >
      <!-- Header -->
      <Header 
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-sidebar="toggleMobileSidebar"
      />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <router-view v-slot="{ Component }">
            <transition
              name="page"
              mode="out-in"
              @before-enter="beforeEnter"
              @enter="enter"
              @leave="leave"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>

      <!-- Footer (Optional) -->
      <footer class="border-t border-gray-200 bg-white py-4 px-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
          <p>© 2025 FinTrak. All rights reserved.</p>
          <div class="flex items-center space-x-4 mt-2 md:mt-0">
            <a href="#" class="hover:text-primary-600 transition-colors">Privacy Policy</a>
            <span class="text-gray-300">•</span>
            <a href="#" class="hover:text-primary-600 transition-colors">Terms of Service</a>
            <span class="text-gray-300">•</span>
            <a href="#" class="hover:text-primary-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>

    <!-- Mobile Overlay for Sidebar -->
    <transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="closeMobileSidebar"
      ></div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';

const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  
  // Save preference to localStorage
  localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value.toString());
};

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false;
};

// Load sidebar preference from localStorage
onMounted(() => {
  const savedPreference = localStorage.getItem('sidebarCollapsed');
  if (savedPreference !== null) {
    isSidebarCollapsed.value = savedPreference === 'true';
  }
  
  // Close mobile sidebar on window resize
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const handleResize = () => {
  if (window.innerWidth >= 1024) {
    isMobileSidebarOpen.value = false;
  }
};

// Page transition animations
const beforeEnter = (el) => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(20px)';
};

const enter = (el, done) => {
  el.offsetHeight; // Trigger reflow
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  el.style.opacity = 1;
  el.style.transform = 'translateY(0)';
  done();
};

const leave = (el, done) => {
  el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  el.style.opacity = 0;
  el.style.transform = 'translateY(-10px)';
  setTimeout(done, 200);
};
</script>

<style scoped>
/* Page transition styles */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
