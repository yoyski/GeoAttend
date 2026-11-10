import { Router } from 'express';
import passport from 'passport';
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

// Google OAuth routes.
// The app opens /google?mobile=true. Google does not send that query back, so we hand it
// over in the OAuth "state" parameter, which Google returns untouched to the callback.
r.get('/google', (req, res, next) => {
  const state = req.query.mobile === 'true' ? 'mobile' : 'web';
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next);
});
r.get('/google/callback', h(c.googleCallback));

// Native Google Sign-In: receives ID token from @capgo/capacitor-social-login
r.post('/google/token', h(c.googleToken));

export default r;