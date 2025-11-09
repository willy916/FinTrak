/** Import des modules nécessaires */
import axios from 'axios'
import router from '@/router'
//import store from '@/stores'

const axiosInstance2 = axios.create({
//    baseURL: 'http://127.0.0.1:8000/api/v1'
   baseURL:  'http://194.163.184.208:6070/api/v1/'
})



export default axiosInstance2
