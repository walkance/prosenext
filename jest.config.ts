
import {Config} from 'jest';

const jestConfig: Config = {
  preset: 'ts-jest',
  verbose: true,
  moduleNameMapper: {
    // tslib: 'tslib/tslib.es6.js',
    '\\.(css|scss|sass|svg)$': '<rootDir>/jest-style-mock.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
  // modulePathIgnorePatterns: ['<rootDir>/dist/*'],
  // setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['./**/**.test.ts'],
};

export default jestConfig;
