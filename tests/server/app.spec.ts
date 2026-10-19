/**
 * @jest-environment node
 */
// Importing the app must have no side effects, so Supertest can drive it
// without a running server, a MySQL connection or a SESSION_SECRET in the env.
import request from 'supertest';

const mockGetConnection = jest.fn();
jest.mock('mysql2', () => ({
  createPool: jest.fn(() => ({
    promise: () => ({ getConnection: mockGetConnection, query: jest.fn() }),
  })),
}));

describe('createApp', () => {
  const savedSecret = process.env.SESSION_SECRET;
  let exitSpy: jest.SpyInstance;

  beforeAll(() => {
    delete process.env.SESSION_SECRET;
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code}) called on import`);
    });
  });

  afterAll(() => {
    process.env.SESSION_SECRET = savedSecret;
    exitSpy.mockRestore();
  });

  it('can be imported without exiting or opening a MySQL connection', () => {
    const { createApp } = require('../../server/app');
    createApp({ sessionSecret: 'test-secret' });

    expect(exitSpy).not.toHaveBeenCalled();
    expect(mockGetConnection).not.toHaveBeenCalled();
  });

  it('serves routes without calling listen', async () => {
    const { createApp } = require('../../server/app');
    const response = await request(createApp({ sessionSecret: 'test-secret' })).get(
      '/api/healthcheck'
    );

    expect(response.status).toBe(200);
  });
});
