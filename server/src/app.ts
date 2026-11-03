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

// CORS configuration - support multiple origins
const allowedOrigins = env.CLIENT_URL.split(',').map(url => url.trim());
app.use(helmet());
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api', api);

app.use(notFound);
app.use(errorHandler);
