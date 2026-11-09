import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import passport from 'passport';
import { User } from '../models/User.js';
import { userDto } from '../services/me.service.js';
import { generateToken, hashToken } from '../utils/tokens.js';
import { signJwt } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';
import { getRandomAvatar } from '../utils/avatar.js';
import { sendEmail, buildVerificationEmail, buildPasswordResetEmail } from '../services/mailer.js';

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
    avatar: getRandomAvatar(), // Assign random avatar on registration
  });

  // Send verification email
  try {
    await sendEmail({
      to: email,
      subject: 'Verify your GeoAttend account',
      html: buildVerificationEmail(name, verificationToken),
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails - user can request resend
  }

  res.status(201).json({
    ok: true,
    data: {
      user: userDto(user),
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid email or password.');
  }

  // Check if user registered with OAuth
  if (user.authProvider === 'google' && !user.passwordHash) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'This account uses Google sign-in. Please use "Sign in with Google".');
  }

  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid email or password.');
  }

  const token = signJwt(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // The native app cannot rely on cross-site cookies, so it asks for the token (?native=1)
  // and sends it back as a Bearer header. The web app never receives the token in JS.
  const isNative = req.query.native === '1';

  res.json({
    ok: true,
    data: {
      user: userDto(user),
      ...(isNative ? { token } : {}),
    },
  });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
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

    // Send password reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your GeoAttend password',
        html: buildPasswordResetEmail(user.name, resetToken),
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't reveal if email exists or if sending failed
    }
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

export const googleCallback = async (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, (err: Error, user: any) => {
    // The flag set in the /google route comes back here as ?state=mobile
    const isMobileApp = req.query.state === 'mobile' || req.query.mobile === 'true';

    if (err || !user) {
      if (isMobileApp) {
        return res.redirect(`geoattend://auth/callback?error=oauth_failed`);
      }
      return res.redirect(`${env.CLIENT_URL}/auth?error=oauth_failed`);
    }

    const token = signJwt(user);

    if (isMobileApp) {
      // Hand the token to the app through its custom-scheme deep link.
      // A page with a meta refresh plus a button is more reliable in a Chrome Custom Tab than a bare 302,
      // because the button is a real user gesture if the automatic redirect is blocked.
      const deepLink = `geoattend://auth/callback?token=${encodeURIComponent(token)}`;
      res
        .status(200)
        .set('Cache-Control', 'no-store')
        .type('html')
        .send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${deepLink}">
<title>Signing you in</title>
</head>
<body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center;padding:24px">
<div>
<p>Returning to GeoAttend...</p>
<p><a href="${deepLink}" style="display:inline-block;padding:12px 24px;border-radius:12px;background:#111;color:#fff;text-decoration:none;font-weight:600">Open GeoAttend</a></p>
</div>
</body>
</html>`);
      return;
    }

    // For web (Vercel), pass token via URL so client can set it as a cookie
    res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
  })(req, res);
};