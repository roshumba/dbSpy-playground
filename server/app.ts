import express, { Express } from 'express';
import routes from './routes';
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';

export interface AppConfig {
  sessionSecret: string;
}

// Builds the app without starting it: no listen, no env checks, no DB calls.
// server.ts starts it; tests pass it straight to Supertest.
export const createApp = ({ sessionSecret }: AppConfig): Express => {
  const app: Express = express();

  // Body parsers. 1mb fits large saves of TableData from the featureTab.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Cookies and CORS
  app.use(cookieParser());
  app.use(cors());

  // Serve static files from 'dist'
  app.use(express.static(path.join(__dirname, '../dist')));

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  routes(app); // register routes AFTER all middlewares

  return app;
};
