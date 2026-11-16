import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind CSS v4 runs as a Vite plugin (no postcss.config.js / tailwind.config.js needed).
// When VITE_API_URL is empty the app calls "/api" and Vite proxies it to the backend on port 5000.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Inline (empty) PostCSS config: Vite will NOT look for any postcss.config.* file
  // (in this folder or a parent folder). Tailwind 4 runs through @tailwindcss/vite above,
  // so an old Tailwind 3 PostCSS config can never break the build again.
  css: {
    postcss: {
      plugins: [],
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});