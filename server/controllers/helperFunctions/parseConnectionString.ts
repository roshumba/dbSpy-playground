export interface ParsedConnection {
  db_type: 'postgres';
  hostname: string;
  port: string;
  username: string;
  password: string;
  database_name: string;
  sslmode?: string;
}

const POSTGRES_SCHEMES = ['postgres:', 'postgresql:'];
const DEFAULT_POSTGRES_PORT = '5432';

export const parseConnectionString = (connectionString: string): ParsedConnection => {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('Invalid connection string');
  }

  if (!POSTGRES_SCHEMES.includes(url.protocol)) {
    throw new Error(
      `Unsupported scheme "${url.protocol}". Use postgres:// or postgresql://`
    );
  }

  // Without credentials, the server would connect as itself (.pgpass, PGPASSWORD).
  if (!url.username || !url.password) {
    throw new Error('Username and password are required');
  }

  // URL keeps userinfo and path percent-encoded; decodeURIComponent throws a
  // URIError on a stray % (e.g. "pass%word"), so turn that into a clear message.
  let username: string, password: string, database_name: string;
  try {
    username = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
    database_name = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error('Invalid % sequence in the connection string. Encode % as %25');
  }

  const parsed: ParsedConnection = {
    db_type: 'postgres',
    hostname: url.hostname,
    port: url.port || DEFAULT_POSTGRES_PORT,
    username,
    password,
    database_name,
  };

  const sslmode = url.searchParams.get('sslmode');
  if (sslmode) parsed.sslmode = sslmode;

  return parsed;
};
