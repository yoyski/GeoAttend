import { Router } from 'express';
import * as c from '../controllers/me.controller.js';
import { validate } from '../middleware/validate.js';
import { patchMeBody, changePasswordBody } from '../schemas.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const r = Router();
r.get('/', h(c.get));
r.patch('/', validate({ body: patchMeBody }), h(c.patch));
r.post('/password', validate({ body: changePasswordBody }), h(c.changePassword));
r.delete('/', h(c.remove));
r.get('/history', h(c.history));
export default r;
