import { env } from '../config/env.js';
import { CheckIn } from '../models/CheckIn.js';
import { Session } from '../models/Session.js';
import type { UserDoc } from '../models/User.js';
import { verifySecret } from '../utils/hash.js';
import { haversine } from '../utils/haversine.js';
import { HttpError } from '../utils/httpError.js';
import { recordDto } from './dto.js';
import { liveHub } from './live.service.js';
import { assertAccuracy, notHere } from './nearby.service.js';

export interface CheckInInput {
  lat: number;
  lng: number;
  accuracy: number;
  passcode?: string;
  token?: string;
  customFields?: Record<string, string>; // Custom column values from attendee
  signature?: string; // Digital signature PNG data URL
}

/** The single source of truth for check-in rules. Order matters. */
export async function checkIn(user: UserDoc, sessionId: string, input: CheckInInput) {
  // 1. GPS quality
  assertAccuracy(input.accuracy);

  // 2. session exists and is open
  const s = await Session.findById(sessionId);
  if (!s) throw notHere();
  if (s.status !== 'Open') throw new HttpError(409, 'SESSION_CLOSED', 'This session is not open for check-in.');

  const now = new Date();
  // Only check if within session time window (startsAt to endsAt)
  if (now.getTime() < s.startsAt.getTime() || now.getTime() > s.endsAt.getTime()) {
    throw new HttpError(409, 'OUTSIDE_TIME_WINDOW', 'Check-in is not open at this time.');
  }

  // 3. location (computed here from raw coordinates, never trusted from the client)
  const distance = haversine(input.lat, input.lng, s.location!.coordinates[1]!, s.location!.coordinates[0]!);
  if (distance > s.radius) throw notHere();

  // 4. the one extra verification chosen by the creator
  // Note: All sessions have a linkToken for sharing, but it's no longer a verification type
  if (s.verification === 'passcode') {
    if (!input.passcode || !s.passcodeHash || !verifySecret(input.passcode, s.passcodeHash)) {
      throw new HttpError(401, 'WRONG_PASSCODE', 'Wrong passcode. Ask the organizer for the right one.');
    }
  } else if (s.verification === 'email') {
    if (!user.verified || !s.allowedEmails.includes(user.email)) {
      throw new HttpError(403, 'EMAIL_NOT_ALLOWED', 'Your verified email is not on the list for this session.');
    }
  }

  // 5. late flag - use session's lateAfterTime if set
  const late = s.lateAfterTime ? now.getTime() > s.lateAfterTime.getTime() : false;

  // 6. record it; the unique (session, user) index blocks duplicates at the database level
  let record;
  try {
    record = await CheckIn.create({
      session: s._id,
      user: user._id,
      name: user.name,
      email: user.email,
      at: now,
      distance,
      accuracy: input.accuracy,
      late,
      customFields: input.customFields || {},
      signature: input.signature || '',
    });
  } catch (err) {
    // MongoDB duplicate key error - user already checked in
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, 'ALREADY_CHECKED_IN', 'You already checked in to this session.');
    }
    throw err;
  }

  // Lock the sheet after first check-in (minor race here is acceptable - worst case lock happens on 2nd)
  if (!s.sheetLocked) {
    const count = await CheckIn.countDocuments({ session: s._id });
    if (count === 1) {
      s.sheetLocked = true;
      await s.save();
    }
  }

  // 7. tell the creator's live view
  const dto = recordDto(record);
  liveHub.publish(s.id, 'checkin', dto);
  return dto;
}
