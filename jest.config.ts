/**
 * Jest Configuration for Neuralis
 *
 * Uses jest-expo preset for React Native + Expo compatibility.
 * Includes path aliases, mock setup, and coverage configuration.
 */

import type { Config } from 'jest';

const config: Config = {
    preset: 'jest-expo',

    // File extensions to look for
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Transform TypeScript files
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|moti|lucide-react-native|zustand)',
    ],

    // Path aliases matching tsconfig
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(json)$': '<rootDir>/__mocks__/fileMock.js',
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Coverage settings
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/types/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    coverageThreshold: {
        global: {
            branches: 30,
            functions: 30,
            lines: 30,
            statements: 30,
        },
    },

    // Test match patterns
    testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)'],

    // Timeout
    testTimeout: 15000,
};

export default config;
