import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In GitHub Pages, the repo name becomes the base path
// e.g. https://JBVinoth333.github.io/ForShe/
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],
  // Set base to /ForShe/ for GitHub Pages, / for local dev
  base: isGitHubPages ? '/ForShe/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
