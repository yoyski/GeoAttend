import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { cacheStrategies } from '../middleware/cache.js';
import * as c from '../controllers/me.controller.js';
import { validate } from '../middleware/validate.js';
import { patchMeBody, changePasswordBody } from '../schemas.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

/**
 * "Who am I" depends on the cookie or Bearer token, so it must never be stored by the browser or a proxy.
 * Otherwise a reload after logout is answered from cache and the user still looks logged in.
 */
const noStore = (_req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store');
  res.set('Vary', 'Cookie, Authorization');
  next();
};

const r = Router();
r.get('/', noStore, h(c.get));
r.patch('/', validate({ body: patchMeBody }), h(c.patch));
r.post('/password', validate({ body: changePasswordBody }), h(c.changePassword));
r.delete('/', h(c.remove));
r.get('/history', cacheStrategies.userPrivate, h(c.history));
export default r;