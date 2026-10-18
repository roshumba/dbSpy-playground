export interface ParsedConnection {
  db_type: 'postgres';
  hostname: string;
  port: string;
  username: string;
  password: string;
  database_name: string;
  sslmode?: string;
}

export const parseConnectionString = (_connectionString: string): ParsedConnection => {
  throw new Error('parseConnectionString: not implemented');
};
