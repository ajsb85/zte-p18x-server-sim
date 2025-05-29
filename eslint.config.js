// eslint.config.js
// @ts-check /* Enables type checking for this file in VS Code */

import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginNode from 'eslint-plugin-node';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'; // For Prettier integration

export default [
  {
    // Global ignores - applies to all configurations
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'build/',
      'postman/*.json',
      'postman/reports/',
      '*.postman_environment.json',
      '*.postman_globals.json',
      'deploy.sh',
      'run_postman_tests.sh',
      'eslint.config.js',
      'jest.config.cjs', // Also ignore the Jest config file if it's cjs
    ],
  },
  // Base configuration for all JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      node: pluginNode,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginNode.configs.recommended.rules,
      'node/no-unpublished-require': 'off',
      'node/no-missing-require': 'off',
      'node/no-unsupported-features/es-syntax': 'off', // Disabled due to TypeError
      'node/no-unsupported-features/es-builtins': 'off', // Disabled due to TypeError
      'node/no-unsupported-features/node-builtins': 'off', // Disable for consistency and to preempt TypeErrors
      'node/no-exports-assign': 'off', // Was causing errors with CJS files in ESM project
      'node/no-deprecated-api': 'off', // Disabled due to TypeError
      'node/no-extraneous-require': 'off', // Disabled due to TypeError
      'no-console': 'off',
    },
  },
  // Configuration for test files
  {
    files: ['tests/**/*.js', '**/*.spec.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'node/no-unpublished-require': 'off',
      'node/no-missing-require': 'off',
    },
  },
  pluginPrettierRecommended,
];
