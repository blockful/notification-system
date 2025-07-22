export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalTeardown: '<rootDir>/src/setup/jest-global-teardown.ts',
  forceExit: true
}; 