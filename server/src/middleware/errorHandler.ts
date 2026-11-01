import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../utils/httpError.js';

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'Route not found.'));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }
  if (err?.name === 'CastError') {
    res.status(400).json({ ok: false, error: { code: 'VALIDATION', message: 'Invalid id.' } });
    return;
  }
  if (err?.code === 11000) {
    res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: 'That already exists.' } });
    return;
  }
  console.error(err);
  res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Internal Server Error' } });
};
