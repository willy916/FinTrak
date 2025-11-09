/** Import des modules nécessaires */
import axios from 'axios'
import router from '@/router'
//import store from '@/stores'

const axiosInstance = axios.create({
//    baseURL: 'http://127.0.0.1:8000/api/v1'
   baseURL:  'http://194.163.184.208:6070/api/v1/'
})



/**
 * Interceptor pour injection token
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    const token =  localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


/**
 * Interceptor des réponses de l'API
 */
axiosInstance.interceptors.response.use(response => {
    return response
}, error => {

   
    console.log(error)
    

    if(!error.response){
        // Erreur rzo
      //  store.commit('displayNotif', {d: true, mes: error})
        return Promise.reject(error)
    }else{
        if(error.response.status == 401){
            localStorage.removeItem('userToken');
            router.push('/auth/login')
        }else{
            // Erreur de l'API
           // store.commit('displayNotif', {d: true, mes: error.response.data.message})
            return Promise.reject(error)
        }
    }
})

export default axiosInstance
