import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';

const app = createApp(App);

// Use router
app.use(router);

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err);
  console.log('Error info:', info);
};

// Mount app
app.mount('#app');
