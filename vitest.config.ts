/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest for the dashboard (CONN-TEST-2).
 *
 * This repo had no test runner, no test dependency and no test script. CI ran
 * `tsc --noEmit` and `next build`, neither of which can see a behavioural
 * regression - and this is the app that owns the KYC wizard and the session
 * handling, where the behavioural bugs actually lived.
 *
 * NO @testing-library/* here. Its current releases declare engines.node >= 22
 * and this repo runs Node 20, so yarn v1 refuses the install outright. Add it
 * alongside the first COMPONENT test, pinned to a version whose engines match
 * the Node actually in use.
 *
 * happy-dom rather than jsdom: jsdom requires `undici`, which conflicts with
 * the copy bundled into current Node and fails at load with
 * "webidl.util.markAsUncloneable is not a function" before any test runs.
 */
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./*" mapping in tsconfig.json.
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['{app,lib}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'app/_design-sandbox/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '.next/', '**/*.config.*', '**/*.d.ts'],
    },
  },
});
