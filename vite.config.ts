/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/, not from the domain root.
  base: '/Professional-Drinks-Branding/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    // Typing through forms is slow in jsdom. These stop a busy machine failing tests on timing.
    testTimeout: 20_000,
    maxWorkers: 4,
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // Placeholders so tests run in CI. Nothing in the suite talks to a real project.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
  },
});
