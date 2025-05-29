module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!jest.config.js',
    '!**/coverage/**',
    '!server.js',
    '!deploy.sh',
    '!run_postman_tests.sh',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  testPathIgnorePatterns: ['/node_modules/', '/.vscode/'],
  setupFilesAfterEnv: ['./tests/setupTests.js'], // Optional: for global test setup
};
