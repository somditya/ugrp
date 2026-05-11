import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.mock.{ts,tsx}',
    '!src/mocks/**',
    '!src/app',
  ],
  coverageDirectory: 'coverage',
};

export default config;
