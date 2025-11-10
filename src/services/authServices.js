import axiosInstance2 from "./axosInstance2";

export const authService = {
  async requestOTP(numero) {
    try {
      const response = await axiosInstance2.post("auth/login/request-otp", {
        login: numero,
      });

      return response.data;
    } catch (error) {
      console.error("Erreur OTP :", error.response?.data || error.message);
      throw error;
    }
  },

  async verifyOTP(numero, code) {
    try {
      const response = await axiosInstance2.post("auth/login/verify-otp", {
        login: numero,
        code: code,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur vérification OTP :", error.response?.data || error.message);
      throw error;
    }
  },
};
