import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const port = process.env.API_PORT || loadEnv(mode, process.cwd(), 'API_').API_PORT || '8787';
  if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error('API_PORT düzgün deyil.');
  return {
    plugins: [react()],
    // Only the API port is read here. Never expose provider credentials to the UI.
    server: { proxy: { '/api': { target: `http://127.0.0.1:${port}`, changeOrigin: true } } },
  };
});
