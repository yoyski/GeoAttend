import { randomBytes, createHash } from 'crypto';

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Generate a strong passcode (6-32 characters, alphanumeric). */
export function generatePasscode(): string {
  return randomBytes(6).toString('hex').slice(0, 12).toUpperCase();
}

/** Alias for generateToken (used in seed and other parts). */
export function randomToken(): string {
  return generateToken();
}
