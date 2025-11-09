
import axiosInstance2 from "./axosInstance2";


export const authService = {
  async requestOTP(numero) {
    const response = await axiosInstance2.post("auth/login/request-otp", {
    "login":numero
    
    })

    if (!response.ok) {
      const error = await response.json();
      console.log(error)
      throw new Error(error.message || 'Erreur de connexion');
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  },

  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};