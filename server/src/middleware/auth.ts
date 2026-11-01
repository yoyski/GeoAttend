import type { NextFunction, Request, Response } from 'express';
import { User, type UserDoc } from '../models/User.js';
import { verifyJwt } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

/**
 * Real JWT authentication. Verifies the token from the httpOnly cookie
 * and loads the user into req.user. Public endpoints can skip this middleware.
 */
export async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Log in first.');
    }

    const payload = verifyJwt(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'User not found.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication. Loads user if token exists, but doesn't fail if missing.
 * Use for endpoints that change behavior based on auth state.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token;
    if (token) {
      const payload = verifyJwt(token);
      const user = await User.findById(payload.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
}

export function currentUser(req: Request): UserDoc {
  if (!req.user) throw new HttpError(401, 'UNAUTHENTICATED', 'Log in first.');
  return req.user;
}
