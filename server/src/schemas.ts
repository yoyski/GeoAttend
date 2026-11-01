import { z } from 'zod';
import { VERIFICATIONS } from './models/Session.js';
import { MAX_RADIUS } from './config/env.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParams = z.object({ id: objectId });
export const recordParams = z.object({ id: objectId, recordId: objectId });

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(128);
const coords = {
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0).max(100000),
};

export const nearbyBody = z.object(coords).strict();
export const detailQuery = z.object({ ...coords, t: z.string().max(100).optional() });
export const checkInBody = z
  .object({ 
    ...coords, 
    passcode: z.string().max(64).optional(), 
    token: z.string().max(100).optional(),
    customFields: z.record(z.string().max(500)).optional(),
    signature: z.string().max(100000).optional() // PNG data URL
  })
  .strict();

const sessionFields = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  venue: z.string().trim().min(1).max(160),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().int().min(1).max(MAX_RADIUS),
  verification: z.enum(VERIFICATIONS),
  passcode: z.string().min(6).max(32),
  allowedEmails: z.array(email).max(2000),
  lateAfterTime: z.coerce.date(),
});

export const createSessionBody = sessionFields
  .partial({ description: true, passcode: true, allowedEmails: true, lateAfterTime: true })
  .strict()
  .superRefine((v, ctx) => {
    if (v.endsAt <= v.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must be after start.' });
    if (v.verification === 'email' && !v.allowedEmails?.length)
      ctx.addIssue({ code: 'custom', path: ['allowedEmails'], message: 'Add at least one email.' });
    if (v.lateAfterTime && (v.lateAfterTime <= v.startsAt || v.lateAfterTime > v.endsAt))
      ctx.addIssue({ code: 'custom', path: ['lateAfterTime'], message: 'Late time must be between start and end.' });
  });


export const updateSessionBody = sessionFields
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

export const listMineQuery = z.object({ status: z.enum(['Open', 'Closed', 'Cancelled']).optional() });
export const sheetBody = z.object({}).passthrough();
export const manualRecordBody = z
  .object({ name: z.string().trim().min(1).max(100), email: email.optional() })
  .strict();

export const patchMeBody = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    notifications: z.object({ reminders: z.boolean().optional(), checkIn: z.boolean().optional() }).strict().optional(),
    avatar: z.string().trim().max(500000).nullable().optional(), // data URL or path
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

// Auth bodies
export const registerBody = z
  .object({
    name: z.string().trim().min(1).max(100),
    email,
    password,
  })
  .strict();

export const loginBody = z
  .object({
    email,
    password,
  })
  .strict();

export const forgotBody = z
  .object({
    email,
  })
  .strict();

export const resetBody = z
  .object({
    token: z.string().min(1),
    password,
  })
  .strict();

export const changePasswordBody = z
  .object({
    currentPassword: password,
    newPassword: password,
  })
  .strict();

