import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserDoc } from '../models/User.js';

export interface JwtPayload {
  userId: string;
}

export function signJwt(user: UserDoc): string {
  return jwt.sign({ userId: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
