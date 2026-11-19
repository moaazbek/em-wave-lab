import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps every asset URL relative, so the static build works from any
// sub-path (for example https://user.github.io/repo/). Routing uses the URL hash.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // 30 s per test: the CI runner is slower, and the DOM tests of the guide run alongside the engine sweeps
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'node', testTimeout: 30000 },
})
