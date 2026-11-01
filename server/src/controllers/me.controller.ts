import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import { User } from '../models/User.js';
import * as me from '../services/me.service.js';
import { HttpError } from '../utils/httpError.js';

export const get = async (req: Request, res: Response) =>
  res.json({ ok: true, data: me.userDto(currentUser(req)) });

export const patch = async (req: Request, res: Response) =>
  res.json({ ok: true, data: await me.updateMe(currentUser(req), req.body) });

export const remove = async (req: Request, res: Response) => {
  await me.deleteMe(currentUser(req));
  res.status(204).end();
};

export const history = async (req: Request, res: Response) =>
  res.json({ ok: true, data: await me.history(currentUser(req)) });

export const changePassword = async (req: Request, res: Response) => {
  const user = currentUser(req);
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Current password is incorrect.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: user._id }, { passwordHash });

  res.json({
    ok: true,
    data: { message: 'Password changed successfully.' },
  });
};
