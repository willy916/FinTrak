<template>
  <div class="skeleton-wrapper">
    <!-- Card Skeleton -->
    <div v-if="type === 'card'" class="card">
      <div class="animate-pulse">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 bg-gray-200 rounded-lg skeleton"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded skeleton w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded skeleton w-32"></div>
          </div>
        </div>
        <div class="h-8 bg-gray-200 rounded skeleton w-40 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded skeleton w-20"></div>
      </div>
    </div>

    <!-- Card with Image Skeleton (pour InvestView) -->
    <div v-else-if="type === 'card-with-image'" class="card">
      <div class="animate-pulse">
        <!-- Image placeholder -->
        <div class="w-full h-48 bg-gray-200 rounded-lg mb-4 skeleton"></div>
        
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3 flex-1">
            <div class="w-12 h-12 bg-gray-200 rounded-lg skeleton"></div>
            <div class="flex-1">
              <div class="h-5 bg-gray-200 rounded skeleton w-32 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded skeleton w-24"></div>
            </div>
          </div>
          <div class="w-16 h-6 bg-gray-200 rounded-full skeleton"></div>
        </div>

        <!-- Description -->
        <div class="mb-4 space-y-2">
          <div class="h-3 bg-gray-200 rounded skeleton w-full"></div>
          <div class="h-3 bg-gray-200 rounded skeleton w-3/4"></div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
          <div>
            <div class="h-3 bg-gray-200 rounded skeleton w-20 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded skeleton w-24"></div>
          </div>
          <div>
            <div class="h-3 bg-gray-200 rounded skeleton w-20 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded skeleton w-16"></div>
          </div>
          <div>
            <div class="h-3 bg-gray-200 rounded skeleton w-16 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded skeleton w-20"></div>
          </div>
          <div>
            <div class="h-3 bg-gray-200 rounded skeleton w-20 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded skeleton w-12"></div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="h-3 bg-gray-200 rounded skeleton w-32"></div>
            <div class="h-3 bg-gray-200 rounded skeleton w-12"></div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 skeleton"></div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center space-x-2">
          <div class="flex-1 h-10 bg-gray-200 rounded-lg skeleton"></div>
          <div class="w-10 h-10 bg-gray-200 rounded-lg skeleton"></div>
        </div>
      </div>
    </div>

    <!-- Table Skeleton -->
    <div v-else-if="type === 'table'" class="bg-white rounded-xl shadow-custom-sm overflow-hidden">
      <div class="animate-pulse">
        <!-- Table Header -->
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex space-x-4">
            <div class="h-4 bg-gray-200 rounded skeleton flex-1"></div>
            <div class="h-4 bg-gray-200 rounded skeleton flex-1"></div>
            <div class="h-4 bg-gray-200 rounded skeleton flex-1"></div>
            <div class="h-4 bg-gray-200 rounded skeleton w-20"></div>
          </div>
        </div>
        <!-- Table Rows -->
        <div v-for="i in rows" :key="i" class="border-b border-gray-100 px-6 py-4">
          <div class="flex space-x-4 items-center">
            <div class="h-3 bg-gray-200 rounded skeleton flex-1"></div>
            <div class="h-3 bg-gray-200 rounded skeleton flex-1"></div>
            <div class="h-3 bg-gray-200 rounded skeleton flex-1"></div>
            <div class="h-6 bg-gray-200 rounded-full skeleton w-20"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Skeleton -->
    <div v-else-if="type === 'chart'" class="card">
      <div class="animate-pulse">
        <div class="flex items-center justify-between mb-6">
          <div class="h-5 bg-gray-200 rounded skeleton w-32"></div>
          <div class="flex space-x-2">
            <div class="h-8 bg-gray-200 rounded-lg skeleton w-20"></div>
            <div class="h-8 bg-gray-200 rounded-lg skeleton w-20"></div>
          </div>
        </div>
        <div class="h-64 bg-gray-100 rounded-lg flex items-end space-x-2 p-4">
          <div class="bg-gray-200 skeleton rounded" :style="`width: ${100/12}%; height: ${Math.random() * 60 + 40}%`" v-for="i in 12" :key="i"></div>
        </div>
      </div>
    </div>

    <!-- Stat Card Skeleton -->
    <div v-else-if="type === 'stat'" class="card">
      <div class="animate-pulse">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="h-3 bg-gray-200 rounded skeleton w-24 mb-3"></div>
            <div class="h-8 bg-gray-200 rounded skeleton w-32 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded skeleton w-16"></div>
          </div>
          <div class="w-12 h-12 bg-gray-200 rounded-lg skeleton"></div>
        </div>
      </div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="space-y-3">
      <div v-for="i in rows" :key="i" class="flex items-center space-x-3 p-4 bg-white rounded-lg">
        <div class="animate-pulse flex items-center space-x-3 w-full">
          <div class="w-10 h-10 bg-gray-200 rounded-full skeleton"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded skeleton w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded skeleton w-1/2"></div>
          </div>
          <div class="h-6 bg-gray-200 rounded-full skeleton w-16"></div>
        </div>
      </div>
    </div>

    <!-- Default Text Skeleton -->
    <div v-else class="animate-pulse">
      <div class="h-4 bg-gray-200 rounded skeleton w-full mb-3"></div>
      <div class="h-4 bg-gray-200 rounded skeleton w-5/6 mb-3"></div>
      <div class="h-4 bg-gray-200 rounded skeleton w-4/6"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['card', 'card-with-image', 'table', 'chart', 'stat', 'list', 'text'].includes(value)
  },
  rows: {
    type: Number,
    default: 5
  }
});
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 20%,
    #f3f4f6 40%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>