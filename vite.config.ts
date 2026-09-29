import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      entries: ['index.html', 'src/main.tsx'],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
        'firebase/app',
        'firebase/auth',
      ],
      exclude: [
        'pg',
        'drizzle-orm',
        'drizzle-kit',
        'firebase-admin',
        'web-push',
        'dotenv',
        'express',
      ],
    },
    server: {
      allowedHosts: true,
      hmr: false,
      watch: null,
    },
  };
});
