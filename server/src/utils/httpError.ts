export type ErrorCode =
  | 'VALIDATION' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'NOT_IMPLEMENTED'
  | 'GPS_TOO_WEAK' | 'NOT_AVAILABLE_HERE' | 'SESSION_CLOSED' | 'OUTSIDE_TIME_WINDOW'
  | 'SESSION_LOCKED' | 'WRONG_PASSCODE' | 'EMAIL_NOT_ALLOWED'
  | 'ALREADY_CHECKED_IN' | 'RATE_LIMITED' | 'CONFLICT' | 'INTERNAL' | 'INVALID_TOKEN';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
