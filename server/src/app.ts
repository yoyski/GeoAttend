import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { env } from './config/env.js';
import { configurePassport } from './config/passport.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import api from './routes/index.js';

export const app = express();

// Initialize Passport
configurePassport();

// Web origins from CLIENT_URL (comma separated), plus the origins the Capacitor app runs on:
// https://localhost (Android, Capacitor 6+), http://localhost (older Android) and capacitor://localhost (iOS).
const nativeOrigins = ['https://localhost', 'http://localhost', 'capacitor://localhost'];
const allowedOrigins = [
  ...env.CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean),
  ...nativeOrigins,
];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, server-to-server, etc.)
      if (!origin) return callback(null, true);

      // Disallowed origins just get no CORS headers, instead of throwing a 500
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api', api);

app.use(notFound);
app.use(errorHandler);