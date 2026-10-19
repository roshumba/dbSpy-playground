/**
 * @jest-environment node
 */
// Checks the path a Postgres link takes on the server without a real database:
// link -> cookieSession -> req.session -> postgresSaveQuery -> INSERT values.
import { Request, Response } from 'express';
import pool from '../../server/models/userModel';
import { cookieSession } from '../../server/routes/index';
import postgresController from '../../server/controllers/postgresData.controller';

// Replace the MySQL app-database pool so importing the controllers opens nothing.
jest.mock('../../server/models/userModel', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const fakeRequest = (fields: Record<string, unknown>) =>
  ({ query: {}, body: {}, session: {}, ...fields } as unknown as Request);

describe('cookieSession', () => {
  it('stores the parsed fields of a Postgres link in the session', () => {
    const req = fakeRequest({
      query: {
        db_type: 'postgres',
        database_link: 'postgres://ana:p%40ss@db.example.com/shop?sslmode=require',
      },
    });
    const next = jest.fn();

    cookieSession(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.session).toEqual({
      db_type: 'postgres',
      hostname: 'db.example.com',
      port: '5432',
      username: 'ana',
      password: 'p@ss',
      database_name: 'shop',
    });
  });

  it('passes a 400 with the parser message to next and leaves the session empty', () => {
    const req = fakeRequest({
      query: { db_type: 'postgres', database_link: 'postgres://localhost/shop' },
    });
    const next = jest.fn();

    cookieSession(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: 'Username and password are required',
      })
    );
    expect(req.session).toEqual({});
  });

  it('does not parse a MySQL link (MySQL is still split in the browser)', () => {
    const req = fakeRequest({
      query: {
        db_type: 'mysql',
        database_link: 'mysql://u:p@mysql.example.com:3306/x',
        hostname: 'mysql.example.com',
      },
    });
    const next = jest.fn();

    cookieSession(req, {} as Response, next);

    // No "Unsupported scheme" 400: the request continues with the browser's fields.
    expect(next).toHaveBeenCalledWith();
    expect(req.session).toEqual(
      expect.objectContaining({ db_type: 'mysql', hostname: 'mysql.example.com' })
    );
  });
});

describe('postgresSaveQuery', () => {
  it('records the host and database the session connected to, not what the body claims', async () => {
    (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 }]);
    const req = fakeRequest({
      session: {
        user: { id: 1, email: 'ana@example.com', username: 'ana', type: 'user' },
        hostname: 'real-host',
        database_name: 'real_db',
      },
      body: {
        params: {
          // Disagrees with the session on purpose: if both said the same thing,
          // this test would pass whichever one the code read.
          dbValues: {
            queryString: 'SELECT 1',
            queryName: 'My Test Query',
            hostname: 'fake-host',
            database_name: 'fake_db',
          },
          extractedQueryRes: { query_date: '2026-10-19', exec_time: 0.042 },
          moreMetrics: {},
        },
      },
    });
    const res = { locals: {}, status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await postgresController.postgresSaveQuery(req, res as unknown as Response, next);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const insertValues = (pool.query as jest.Mock).mock.calls[0][1];
    // INSERT column order: email, query, db_link, exec_time, db_name, ...
    expect(insertValues[2]).toBe('real-host');
    expect(insertValues[4]).toBe('real_db');
  });
});
