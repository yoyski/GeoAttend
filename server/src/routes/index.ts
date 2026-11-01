import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import authRoutes from './auth.routes.js';
import meRoutes from './me.routes.js';
import sessionRoutes from './sessions.routes.js';

const api = Router();
api.get('/health', (_req, res) => {
  res.json({ status: 'Backend is running' });
});
api.use('/auth', authRoutes);
// These routes require authentication
api.use('/me', auth, meRoutes);
// Session routes with mixed auth requirements
api.use('/sessions', sessionRoutes);
export default api;
