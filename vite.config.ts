import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Pre-bundle the shadcn stack up front. Discovering one of these mid-session
    // makes Vite re-optimize and reload with a second copy of React.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      '@base-ui/react/button',
      '@base-ui/react/merge-props',
      '@base-ui/react/use-render',
      'class-variance-authority',
      'cn',
      'lucide-react',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
