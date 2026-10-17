// Runs only the tests that need the Docker databases (npm run test:infra).
// Kept separate so plain `npm test` doesn't depend on Docker.
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/infra'],
  collectCoverage: false,
};
