/**
 * @jest-environment node
 */
// Node's URL parser, not jsdom's: the server is what will run this.
import { parseConnectionString } from '../../server/controllers/helperFunctions/parseConnectionString';

describe('parseConnectionString', () => {
  it.each(['postgres', 'postgresql'])('accepts the %s:// scheme', (scheme) => {
    expect(parseConnectionString(`${scheme}://ana:secret@db.example.com:5433/shop`)).toEqual({
      db_type: 'postgres',
      hostname: 'db.example.com',
      port: '5433',
      username: 'ana',
      password: 'secret',
      database_name: 'shop',
    });
  });

  it('splits on the last @ when the password contains a raw @', () => {
    const parsed = parseConnectionString('postgres://ana:p@ss@db.example.com:5432/shop');
    expect(parsed.password).toBe('p@ss');
    expect(parsed.hostname).toBe('db.example.com');
  });

  it('decodes a percent-encoded password', () => {
    const parsed = parseConnectionString('postgres://ana:p%40ss@db.example.com:5432/shop');
    expect(parsed.password).toBe('p@ss');
  });

  it('reads sslmode without leaking the query string into the database name', () => {
    const parsed = parseConnectionString(
      'postgres://ana:secret@db.example.com:5432/shop?sslmode=require'
    );
    expect(parsed.database_name).toBe('shop');
    expect(parsed.sslmode).toBe('require');
  });

  it('defaults the port to 5432 when none is given', () => {
    const parsed = parseConnectionString('postgres://ana:secret@db.example.com/shop');
    expect(parsed.port).toBe('5432');
  });

  it('rejects a URL without a username and password', () => {
    expect(() => parseConnectionString('postgres://localhost/shop')).toThrow(
      'Username and password are required'
    );
  });
});
