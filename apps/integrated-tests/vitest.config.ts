import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    restoreMocks: true,
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: 'forks',
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./src/setup/vitest/global-setup.ts'],
    setupFiles: ['./src/setup/vitest/setup.ts'],
  },
});
