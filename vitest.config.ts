/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'

// Unit tests deliberately skip the TanStack Start plugin: route generation and
// SSR transforms aren't needed to exercise components or pure logic.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // `scripts/` is included so build tooling is tested like anything else.
    // It is plain JavaScript, run by node rather than bundled, so `.mjs` has
    // to be listed alongside the application's extensions.
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
  },
})
