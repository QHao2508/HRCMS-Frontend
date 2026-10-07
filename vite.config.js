import process from 'node:process';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://localhost:5299';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: Object.fromEntries(['/api', '/health', '/openapi'].map(path => [path, { target, changeOrigin: true }])),
    },
  };
});
