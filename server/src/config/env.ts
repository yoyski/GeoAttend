import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/mern-app'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  MAX_GPS_ACCURACY: z.coerce.number().default(100),
  LATE_AFTER_MINUTES: z.coerce.number().default(10),
  EARLY_CHECKIN_MINUTES: z.coerce.number().default(15),
  LINK_SESSIONS_IN_LIST: z.enum(['true', 'false']).default('false'),
});

export const env = schema.parse(process.env);
export const MAX_RADIUS = 400; // metres, must match the model and validation
