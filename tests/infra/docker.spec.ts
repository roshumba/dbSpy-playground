/**
 * @jest-environment node
 *
 * Checks that the local Docker databases are up and set up as expected.
 * Needs the containers running: npm run db:up && npm run test:infra
 */
import { Client } from 'pg';
import Redis from 'ioredis';

const pgConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'dbspy',
  password: process.env.POSTGRES_PASSWORD || 'dbspy_local',
  connectionTimeoutMillis: 3000,
};

const SAMPLE_TABLES = [
  'favorites',
  'projects',
  'projects_skills_join_table',
  'skills',
  'users',
  'users_projects_join_table',
  'users_skills_join_table',
];

describe('Postgres container', () => {
  const admin = new Client({ ...pgConfig, database: 'postgres' });
  const sample = new Client({ ...pgConfig, database: 'dbspy_sample' });

  beforeAll(async () => {
    await admin.connect();
    await sample.connect();
  });

  afterAll(async () => {
    await admin.end().catch(() => {});
    await sample.end().catch(() => {});
  });

  it('runs Postgres 16', async () => {
    const { rows } = await admin.query('SHOW server_version');
    expect(rows[0].server_version).toMatch(/^16\./);
  });

  it('has the app, sample and test databases', async () => {
    const { rows } = await admin.query(
      'SELECT datname FROM pg_database WHERE datname = ANY($1) ORDER BY datname',
      [['dbspy_app', 'dbspy_sample', 'dbspy_test']]
    );
    expect(rows.map((r) => r.datname)).toEqual(['dbspy_app', 'dbspy_sample', 'dbspy_test']);
  });

  it('loaded the sample dataset into dbspy_sample', async () => {
    const { rows } = await sample.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    expect(rows.map((r) => r.table_name)).toEqual(SAMPLE_TABLES);
  });
});

describe('Redis container', () => {
  // Fail fast instead of retrying forever when Redis is down.
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  });

  beforeAll(async () => {
    await redis.connect();
  });

  afterAll(() => {
    redis.disconnect();
  });

  it('answers PING', async () => {
    expect(await redis.ping()).toBe('PONG');
  });

  it('stores a key that expires', async () => {
    await redis.set('infra-test:key', 'v', 'EX', 5);
    expect(await redis.get('infra-test:key')).toBe('v');
    expect(await redis.ttl('infra-test:key')).toBeGreaterThan(0);
    await redis.del('infra-test:key');
  });
});
