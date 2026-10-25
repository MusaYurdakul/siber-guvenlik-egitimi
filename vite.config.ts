import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
    // xfwd: API'nin kaynak denetimi için özgün adresi (x-forwarded-host) iletir.
    proxy: { '/api': { target: `http://localhost:${process.env.TRAINING_PORT ?? 8797}`, xfwd: true } },
  },
});
