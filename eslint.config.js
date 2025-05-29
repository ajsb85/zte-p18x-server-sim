// eslint.config.js
// @ts-check /* Enables type checking for this file in VS Code */

import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginNode from 'eslint-plugin-node';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

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
      'jest.config.cjs',
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
      'node/no-unsupported-features/es-syntax': 'off',
      'node/no-unsupported-features/es-builtins': 'off',
      'node/no-unsupported-features/node-builtins': 'off',
      'node/no-exports-assign': 'off',
      'node/no-deprecated-api': 'off',
      'node/no-extraneous-require': 'off',
      'no-console': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none', // Keep default or set to 'all' if you want to ignore all caught errors
          caughtErrorsIgnorePattern: '^_', // Specifically ignore caught errors prefixed with _
        },
      ],
      'no-prototype-builtins': 'off',
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
      'node/no-unpublished-import': 'off',
      'node/no-extraneous-import': [
        'error',
        { allowModules: ['@jest/globals', 'supertest'] },
      ],
    },
  },
  pluginPrettierRecommended,
];
