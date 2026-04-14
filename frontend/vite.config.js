import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // This tells Vite to use the automatic JSX transform
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 3000,
  },
});