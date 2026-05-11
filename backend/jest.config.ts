import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts', '**/src/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts',
    '!src/mocks/**',
  ],
  coverageDirectory: 'coverage',
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
};

export default config;
