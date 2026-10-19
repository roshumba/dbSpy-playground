import { config } from 'dotenv';
import log from './logger';
import { createApp } from './app';
import { checkUserDbConnection } from './models/userModel';

config(); // load .env variables

const port: number = Number(process.env.PORT) || 3000;

if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not defined in environment variables!');
  process.exit(1); // Exit early if SESSION_SECRET is missing
}

const app = createApp({ sessionSecret: process.env.SESSION_SECRET });

checkUserDbConnection();

app.listen(port, () => {
  log.info(`✅ Server running securely at ${port}`);
});
