import { pathsToModuleNameMapper } from 'ts-jest';
const { compilerOptions } = require('../../tsconfig.json');

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { 
    prefix: '<rootDir>/../../' 
  })
}; 