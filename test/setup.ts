import {
  cleanupSharedTestDatabase,
  configureSharedTestEnvironment,
  resetSharedTestDatabase,
} from './helpers/testDatabase';

configureSharedTestEnvironment();

export const mochaHooks = {
  async beforeAll() {
    await resetSharedTestDatabase();
  },

  async beforeEach() {
    await resetSharedTestDatabase();
  },

  async afterAll() {
    await cleanupSharedTestDatabase();
  },
};
