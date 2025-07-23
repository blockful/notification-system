export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/src/setup/jest-global-setup.ts',
  globalTeardown: '<rootDir>/src/setup/jest-global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/setup/jest-setup-after-env.ts'],
  forceExit: true,
  silent: true,
  verbose: true,
}; 