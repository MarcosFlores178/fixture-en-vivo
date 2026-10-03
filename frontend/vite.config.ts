import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite' // <-- ASEGURATE DE QUE ESTE IMPORT EXISTA

export default defineConfig({
  plugins: [react(),  tailwindcss() // <-- VERIFICA QUE ESTÉ INCLUIDO ACÁ
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
