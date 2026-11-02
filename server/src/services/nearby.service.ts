import { MAX_RADIUS } from '../config/env.js';
import { CheckIn } from '../models/CheckIn.js';
import { Session, type SessionDoc } from '../models/Session.js';
import type { UserDoc } from '../models/User.js';
import { haversine } from '../utils/haversine.js';
import { HttpError } from '../utils/httpError.js';
import { participantDto } from './dto.js';

export const notHere = () =>
  new HttpError(403, 'NOT_AVAILABLE_HERE', 'This session is not available from your location.');

const allowedByEmail = (s: SessionDoc, user: UserDoc) =>
  user.verified && s.allowedEmails.includes(user.email);

/**
 * Sessions the person can see right now: Open, inside the time window, and the person is INSIDE the radius.
 * Anything outside the radius is never returned (no title, venue or map).
 * `user` may be null: anyone inside the radius can look, only checking in needs an account.
 *
 * Verification (passcode/email) is checked at check-in time, NOT when listing sessions.
 * Note: All sessions have a linkToken for sharing, but it's no longer a verification type.
 */
export async function findNearby(user: UserDoc | null, p: { lat: number; lng: number; accuracy: number }) {
  const now = new Date();

  const rows = await Session.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [p.lng, p.lat] },
        distanceField: 'distance',
        maxDistance: MAX_RADIUS,
        spherical: true,
        query: { status: 'Open', startsAt: { $lte: now }, endsAt: { $gte: now } },
      },
    },
    { $match: { $expr: { $lte: ['$distance', '$radius'] } } },
  ]);

  const visible = rows.map((row) => ({ doc: Session.hydrate(row) as SessionDoc, distance: row.distance as number }));

  // Guests have no check-ins, so nothing is marked as done for them.
  const done = user
    ? new Set(
        (await CheckIn.find({ user: user._id, session: { $in: visible.map((v) => v.doc._id) } }).distinct('session')).map(String),
      )
    : new Set<string>();
  return visible.map(({ doc, distance }) => participantDto(doc, distance, done.has(doc.id)));
}

/**
 * One session for a participant. Same rule: outside the radius returns nothing about it.
 * `user` may be null: a guest inside the radius sees the session (checkedIn is false) and is asked to log in
 * only when they press Check in. The check-in route itself still requires an account.
 */
export async function getForParticipant(
  user: UserDoc | null,
  id: string,
  p: { lat: number; lng: number; accuracy: number; t?: string },
) {
  const s = await Session.findById(id);
  if (!s) throw notHere();
  const distance = haversine(p.lat, p.lng, s.location!.coordinates[1]!, s.location!.coordinates[0]!);
  if (distance > s.radius) throw notHere();

  // Guest inside the radius: show the session, not checked in. (Email-list sessions are enforced at check-in.)
  if (!user) return participantDto(s, distance, false);

  if (s.verification === 'email' && !allowedByEmail(s, user)) {
    throw new HttpError(403, 'EMAIL_NOT_ALLOWED', 'Your verified email is not on the list for this session.');
  }
  // Note: linkToken check removed - all sessions can be accessed via link/QR regardless of verification type
  const checkedIn = !!(await CheckIn.exists({ session: s._id, user: user._id }));
  return participantDto(s, distance, checkedIn);
}