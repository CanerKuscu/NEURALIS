const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

/**
 * ESLint Flat Config (CommonJS) for ESLint v9+
 * - Keeps `npm run lint` working
 * - Avoids false-positive errors for RN globals (setTimeout, console, fetch, __DEV__, etc.)
 * - Allows Metro/Expo patterns like `require(...)` for assets
 */
module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/',
      'supabase/functions/',
      '.expo/**',
      'supabase/**',
      'functions/**',
      'scripts/**',
      'android/**',
      'ios/**',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // Node-ish globals for config files
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },

  // TypeScript / TSX
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      globals: {
        // RN / JS runtime
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        // Expo / bundler
        __DEV__: 'readonly',
        // Node-like (sometimes referenced)
        process: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'prettier': prettierPlugin,
    },
    rules: {
      ...(tsPlugin.configs.recommended?.rules ?? {}),

      // Avoid RN false-positives
      'no-undef': 'off',

      // Allow empty catches in some compatibility shims
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // Metro/Expo asset patterns frequently use require()
      '@typescript-eslint/no-require-imports': 'off',

      // Some regex-heavy code triggers false positives
      'no-useless-escape': 'off',

      // Project conventions
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // Prettier integration
      'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
    },
  },

  // Prettier recommended config (disables conflicting ESLint rules)
  prettierConfig,
];

