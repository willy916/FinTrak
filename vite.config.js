import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Cible vers laquelle le serveur de dev relaie les appels /api.
  // Mettre http://localhost:8080 pour taper un backend lance en local.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://api.eonda.online';

  /**
   * Proxy de developpement.
   *
   * Le front tourne sur localhost:3000 et l'API sur un autre domaine. Sans proxy,
   * le navigateur bloque la requete (CORS) tant que le serveur ne renvoie pas
   * d'en-tete Access-Control-Allow-Origin pour cette origine.
   *
   * Avec le proxy, le navigateur appelle localhost:3000/api/... (meme origine,
   * donc aucun controle CORS) et Vite relaie la requete cote serveur vers l'API.
   *
   * IMPORTANT : on supprime les en-tetes Origin et Referer avant de relayer.
   * Le navigateur les envoie toujours, et le proxy les transmettrait tels quels.
   * Spring Security, quand http.cors() est actif, rejette alors la requete avec
   * un 403 "Invalid CORS request" parce que localhost:3000 n'est pas dans son
   * allowlist. Sans en-tete Origin, la requete est vue comme un appel
   * serveur-a-serveur (comme curl ou Postman) et aucun controle CORS ne s'applique.
   *
   * En production, c'est au backend d'autoriser le domaine du front
   * (ou au reverse proxy de servir front et API sur le meme domaine).
   */
  const proxy = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      secure: true,
      configure: (proxyServer) => {
        proxyServer.on('proxyReq', (proxyReq) => {
          proxyReq.removeHeader('origin');
          proxyReq.removeHeader('referer');
        });

        // Trace des appels dans le terminal, pour diagnostiquer sans DevTools.
        proxyServer.on('proxyRes', (proxyRes, req) => {
          const code = proxyRes.statusCode;
          const flag = code >= 400 ? '  <-- erreur API' : '';
          console.log(`[api] ${req.method} ${req.url} -> ${code}${flag}`);
        });

        proxyServer.on('error', (err, req) => {
          console.error(`[api] echec ${req.method} ${req.url} : ${err.message}`);
        });
      },
    },
  };

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router'],
          },
        },
      },
    },
  };
});
