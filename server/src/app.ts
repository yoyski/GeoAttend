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

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api', api);

app.use(notFound);
app.use(errorHandler);
