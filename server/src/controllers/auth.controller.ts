import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { userDto } from '../services/me.service.js';
import { generateToken, hashToken } from '../utils/tokens.js';
import { signJwt } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  if (await User.exists({ email })) {
    throw new HttpError(409, 'CONFLICT', 'That email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = generateToken();
  const verificationTokenHash = hashToken(verificationToken);

  const user = await User.create({
    name,
    email,
    passwordHash,
    verified: false,
    verificationToken: verificationTokenHash,
    verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  res.status(201).json({
    ok: true,
    data: {
      user: userDto(user),
      verificationToken,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid email or password.');
  }

  const token = signJwt(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    ok: true,
    data: {
      user: userDto(user),
    },
  });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(204).end();
};

export const verify = async (req: Request, res: Response) => {
  const { token } = req.params;
  const tokenHash = hashToken(token);

  const user = await User.findOneAndUpdate(
    {
      verificationToken: tokenHash,
      verificationExpires: { $gt: new Date() },
    },
    {
      verified: true,
      verificationToken: null,
      verificationExpires: null,
    },
    { new: true },
  );

  if (!user) {
    throw new HttpError(400, 'INVALID_TOKEN', 'Invalid or expired verification link.');
  }

  res.json({
    ok: true,
    data: {
      user: userDto(user),
    },
  });
};

export const forgot = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  // Always succeed so we don't leak which emails exist
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = generateToken();
    const resetTokenHash = hashToken(resetToken);

    await User.updateOne(
      { _id: user._id },
      {
        resetToken: resetTokenHash,
        resetExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    );

    // TODO: Send email with resetToken
  }

  res.json({
    ok: true,
    data: {
      sent: true,
    },
  });
};

export const reset = async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  const tokenHash = hashToken(token);

  const user = await User.findOneAndUpdate(
    {
      resetToken: tokenHash,
      resetExpires: { $gt: new Date() },
    },
    {
      passwordHash: await bcrypt.hash(password, 12),
      resetToken: null,
      resetExpires: null,
    },
    { new: true },
  );

  if (!user) {
    throw new HttpError(400, 'INVALID_TOKEN', 'Invalid or expired reset link.');
  }

  res.json({
    ok: true,
    data: {
      user: userDto(user),
    },
  });
};
