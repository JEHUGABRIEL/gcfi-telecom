import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  if (mode === 'production') {
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    required.forEach(key => {
      if (!env[key]) throw new Error(`Variable manquante : ${key}`);
    });
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      historyApiFallback: true,
    },
    preview: {
      historyApiFallback: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':    ['react', 'react-dom'],
            'vendor-router':   ['react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-motion':   ['motion'],
            'vendor-ui':       ['lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
