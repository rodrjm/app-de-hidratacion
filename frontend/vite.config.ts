import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Deshabilitar temporalmente PWA para evitar problemas de cache
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'Dosis vital: Tu aplicación de hidratación personal - Hidratación Inteligente',
    //     short_name: 'Dosis vital: Tu aplicación de hidratación personal',
    //     description: 'Aplicación para seguimiento de hidratación personal',
    //     theme_color: '#4CAF50',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/api\./,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 60 * 24 // 24 horas
    //           }
    //         }
    //       }
    //     ]
    //   }
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Deshabilitar manual chunks para evitar problemas de orden de carga
        // manualChunks: (id) => {
        //   // Vendor chunks - Asegurar que React se carga primero
        //   if (id.includes('node_modules')) {
        //     // React debe estar en su propio chunk y cargarse primero
        //     if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
        //       return 'vendor-react';
        //     }
        //     if (id.includes('react-router')) {
        //       return 'vendor-router';
        //     }
        //     if (id.includes('zustand')) {
        //       return 'vendor-state';
        //     }
        //     if (id.includes('lucide-react')) {
        //       return 'vendor-icons';
        //     }
        //     if (id.includes('recharts')) {
        //       return 'vendor-charts';
        //     }
        //     if (id.includes('react-hot-toast')) {
        //       return 'vendor-toast';
        //     }
        //     // Other node_modules
        //     return 'vendor';
        //   }
        // }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
      },
    },
  }
})
