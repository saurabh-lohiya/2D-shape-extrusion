// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000, // or any other port you prefer
  },
  build: {
    outDir: 'dist',
  },
});
