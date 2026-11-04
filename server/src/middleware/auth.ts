import type { NextFunction, Request, Response } from 'express';
import { User, type UserDoc } from '../models/User.js';
import { verifyJwt } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

// Extend Express Request to include our UserDoc type
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDoc;
  }
}

/**
 * Reads the JWT from "Authorization: Bearer <token>" (native app) or the httpOnly cookie (web).
 */
function getToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }
  return req.cookies?.token as string | undefined;
}

/**
 * Real JWT authentication. Verifies the token from the Bearer header or the httpOnly cookie
 * and loads the user into req.user. Public endpoints can skip this middleware.
 */
export async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
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
    const token = getToken(req);
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