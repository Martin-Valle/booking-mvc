import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Definir process.env para que funcione en el navegador
    'process.env': JSON.stringify({
      DATA_BACKEND: 'memory',  // Usar memoria en lugar de PostgreSQL en el navegador
      PGSSL: 'false',
      PGSSL_REJECT_UNAUTHORIZED: 'false',
      DATABASE_URL: ''
    }),
    'global': 'globalThis',
  },
  server: {
    fs: {
      // Solo permitir servir archivos de src, public y node_modules
      allow: ['.']
    },
    watch: {
      // Ignorar cambios en esb/ y server/
      ignored: ['**/esb/**', '**/server/**']
    }
  },
  optimizeDeps: {
    // Excluir módulos que no deben ser pre-bundled
    exclude: ['pg']
  }
});
