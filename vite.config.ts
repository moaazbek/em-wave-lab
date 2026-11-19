import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps every asset URL relative, so the static build works from any
// sub-path (for example https://user.github.io/repo/). Routing uses the URL hash.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'node' },
})
