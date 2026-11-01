import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { registerBody, loginBody, forgotBody, resetBody } from '../schemas.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const r = Router();
r.use(authLimiter);
r.post('/register', validate({ body: registerBody }), h(c.register));
r.post('/login', validate({ body: loginBody }), h(c.login));
r.post('/logout', c.logout);
r.get('/verify/:token', h(c.verify));
r.post('/forgot', validate({ body: forgotBody }), h(c.forgot));
r.post('/reset', validate({ body: resetBody }), h(c.reset));
export default r;

