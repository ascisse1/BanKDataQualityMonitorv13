import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    host: true, // Listen on all addresses
    port: 5174,
    strictPort: false,
    proxy: {
<<<<<<< HEAD
      // OAuth2 endpoints - Spring Boot BFF
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        headers: { host: "localhost:5174" },

      },
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        headers: { host: "localhost:5174" },

      },
      '/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // API endpoints - Spring Boot
      '/api': {
        target: 'http://localhost:8080',
=======
      '/api': {
        target: 'http://localhost:3001',
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'tanstack-vendor': ['@tanstack/react-table', '@tanstack/react-query', '@tanstack/react-virtual'],
          'chart-vendor': ['apexcharts', 'react-apexcharts'],
          'ui-vendor': ['lucide-react'],
          'form-vendor': ['react-hook-form', 'zustand'],
          'export-vendor': ['jspdf', 'jspdf-autotable', 'xlsx']
        },
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-table',
      '@tanstack/react-query',
      '@tanstack/react-virtual',
      '@tanstack/react-table',
      'apexcharts',
      'react-apexcharts',
      'react-hook-form',
      'jspdf',
      'jspdf-autotable',
      'xlsx'
    ],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis'
      }
    },
    force: true
  },
  preview: {
    host: true,
    port: 5174,
    strictPort: false
  },
  cacheDir: './.vite-cache',
  logLevel: 'info'
<<<<<<< HEAD
});
=======
});
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
