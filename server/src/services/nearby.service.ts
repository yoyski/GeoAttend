import { env, MAX_RADIUS } from '../config/env.js';
import { CheckIn } from '../models/CheckIn.js';
import { Session, type SessionDoc } from '../models/Session.js';
import type { UserDoc } from '../models/User.js';
import { haversine } from '../utils/haversine.js';
import { HttpError } from '../utils/httpError.js';
import { participantDto } from './dto.js';

export const notHere = () =>
  new HttpError(403, 'NOT_AVAILABLE_HERE', 'This session is not available from your location.');

export function assertAccuracy(accuracy: number) {
  if (accuracy > env.MAX_GPS_ACCURACY) {
    throw new HttpError(422, 'GPS_TOO_WEAK', `GPS signal is too weak (±${Math.round(accuracy)} m). Move to open sky and try again.`);
  }
}

const allowedByEmail = (s: SessionDoc, user: UserDoc) =>
  user.verified && s.allowedEmails.includes(user.email);

/**
 * Sessions the user can see right now: Open, inside the time window, and the user is INSIDE the radius.
 * Anything outside the radius is never returned (no title, venue or map).
 * 
 * Verification (passcode/email) is checked at check-in time, NOT when listing sessions.
 * Note: All sessions have a linkToken for sharing, but it's no longer a verification type.
 */
export async function findNearby(user: UserDoc, p: { lat: number; lng: number; accuracy: number }) {
  assertAccuracy(p.accuracy);
  const now = new Date();
  const early = new Date(now.getTime() + env.EARLY_CHECKIN_MINUTES * 60_000);

  const rows = await Session.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [p.lng, p.lat] },
        distanceField: 'distance',
        maxDistance: MAX_RADIUS,
        spherical: true,
        query: { status: 'Open', startsAt: { $lte: early }, endsAt: { $gte: now } },
      },
    },
    { $match: { $expr: { $lte: ['$distance', '$radius'] } } },
  ]);

  const visible = rows.map((row) => ({ doc: Session.hydrate(row) as SessionDoc, distance: row.distance as number }));

  const done = new Set(
    (await CheckIn.find({ user: user._id, session: { $in: visible.map((v) => v.doc._id) } }).distinct('session')).map(String),
  );
  return visible.map(({ doc, distance }) => participantDto(doc, distance, done.has(doc.id)));
}

/** One session for a participant. Same rule: outside the radius returns nothing about it. */
export async function getForParticipant(
  user: UserDoc | null,
  id: string,
  p: { lat: number; lng: number; accuracy: number; t?: string },
) {
  // Note: We don't check accuracy here - only distance from venue matters
  const s = await Session.findById(id);
  if (!s) throw notHere();
  const distance = haversine(p.lat, p.lng, s.location!.coordinates[1]!, s.location!.coordinates[0]!);
  if (distance > s.radius) throw notHere();
  
  // If not authenticated, return limited info for location check
  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Log in to check in.');
  }
  
  if (s.verification === 'email' && !allowedByEmail(s, user)) {
    throw new HttpError(403, 'EMAIL_NOT_ALLOWED', 'Your verified email is not on the list for this session.');
  }
  // Note: linkToken check removed - all sessions can be accessed via link/QR regardless of verification type
  const checkedIn = !!(await CheckIn.exists({ session: s._id, user: user._id }));
  return participantDto(s, distance, checkedIn);
}
