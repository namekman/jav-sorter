import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { configureWsServer } from './src/ws'

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    {
      name: 'socket.io',
      configureServer: configureWsServer,
    },
    tanstackStart(),
    nitro(),
    viteReact(),
  ],
  nitro: {
  },
  build: {
    rollupOptions: {
      external: ['sqlite3'],
    },
  },
})

export default config
