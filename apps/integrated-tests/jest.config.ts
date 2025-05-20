import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import path from 'path';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@notification-system/(.*)$': path.resolve(__dirname, '../$1')
  },
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../..')],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: path.resolve(__dirname, 'tsconfig.json')
    }]
  }
};

export default config; 