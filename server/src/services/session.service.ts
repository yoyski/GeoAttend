import { CheckIn } from '../models/CheckIn.js';
import { Session, type SessionDoc } from '../models/Session.js';
import type { UserDoc } from '../models/User.js';
import { hashSecret } from '../utils/hash.js';
import { HttpError } from '../utils/httpError.js';
import { generatePasscode, randomToken } from '../utils/tokens.js';
import { creatorDto } from './dto.js';
import { liveHub } from './live.service.js';

export interface SessionInput {
  title: string;
  description?: string;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  lat: number;
  lng: number;
  radius: number;
  verification: 'location' | 'passcode' | 'email';
  passcode?: string;
  allowedEmails?: string[];
}

const countFor = (sessionId: unknown) => CheckIn.countDocuments({ session: sessionId });

export async function getOwned(user: UserDoc, id: string): Promise<SessionDoc> {
  const s = await Session.findOne({ _id: id, creator: user._id });
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Session not found.'); // 404 so we never reveal other people's sessions
  return s;
}

export async function createSession(user: UserDoc, input: SessionInput) {
  let passcode: string | undefined;
  let passcodeHash: string | undefined;
  if (input.verification === 'passcode') {
    passcode = input.passcode ?? generatePasscode();
    passcodeHash = hashSecret(passcode);
  }
  const s = await Session.create({
    creator: user._id,
    title: input.title,
    description: input.description ?? '',
    venue: input.venue,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: { type: 'Point', coordinates: [input.lng, input.lat] },
    radius: input.radius,
    verification: input.verification,
    passcodeHash: passcodeHash || undefined,
    linkToken: randomToken(),
    allowedEmails: input.verification === 'email' ? [...new Set(input.allowedEmails ?? [])] : [],
  });
  // The passcode is returned ONCE here. Only its hash is stored.
  return { session: creatorDto(s, 0), passcode };
}

export async function listMine(user: UserDoc, status?: string) {
  const sessions = await Session.find({ creator: user._id, ...(status ? { status } : {}) }).sort({ startsAt: -1 });
  const counts = await CheckIn.aggregate([
    { $match: { session: { $in: sessions.map((s) => s._id) } } },
    { $group: { _id: '$session', n: { $sum: 1 } } },
  ]);
  const byId = new Map<string, number>(counts.map((c) => [String(c._id), c.n as number]));
  return sessions.map((s) => creatorDto(s, byId.get(s.id) ?? 0));
}

export async function getMine(user: UserDoc, id: string) {
  const s = await getOwned(user, id);
  return creatorDto(s, await countFor(s._id));
}

const LOCKED_FIELDS = ['lat', 'lng', 'radius', 'verification', 'passcode', 'allowedEmails'] as const;

export async function updateSession(user: UserDoc, id: string, patch: Partial<SessionInput>) {
  const s = await getOwned(user, id);
  const count = await countFor(s._id);
  if (count > 0 && LOCKED_FIELDS.some((f) => patch[f] !== undefined)) {
    throw new HttpError(409, 'SESSION_LOCKED', 'Location, radius and verification are locked after the first check-in.');
  }

  if (patch.title !== undefined) s.title = patch.title;
  if (patch.description !== undefined) s.description = patch.description;
  if (patch.venue !== undefined) s.venue = patch.venue;
  if (patch.startsAt !== undefined) s.startsAt = patch.startsAt;
  if (patch.endsAt !== undefined) s.endsAt = patch.endsAt;
  if (s.endsAt <= s.startsAt) throw new HttpError(400, 'VALIDATION', 'End must be after start.');
  if (patch.radius !== undefined) s.radius = patch.radius;
  if (patch.lat !== undefined || patch.lng !== undefined) {
    s.location = {
      type: 'Point',
      coordinates: [patch.lng ?? s.location!.coordinates[0]!, patch.lat ?? s.location!.coordinates[1]!],
    };
  }

  let passcode: string | undefined;
  if (patch.verification !== undefined) s.verification = patch.verification;
  if (s.verification === 'passcode' && (patch.passcode !== undefined || !s.passcodeHash)) {
    passcode = patch.passcode ?? generatePasscode();
    s.passcodeHash = hashSecret(passcode!);
  }
  if (s.verification !== 'passcode') s.passcodeHash = undefined;
  if (patch.allowedEmails !== undefined || s.verification !== 'email') {
    s.allowedEmails = s.verification === 'email' ? [...new Set(patch.allowedEmails ?? s.allowedEmails)] : [];
  }
  if (s.verification === 'email' && s.allowedEmails.length === 0) {
    throw new HttpError(400, 'VALIDATION', 'Add at least one authorized email.');
  }
  await s.save();
  return { session: creatorDto(s, count), passcode };
}

export async function setStatus(user: UserDoc, id: string, status: 'Open' | 'Closed' | 'Cancelled') {
  const s = await getOwned(user, id);
  s.status = status;
  await s.save();
  liveHub.publish(s.id, 'status', { status });
  return creatorDto(s, await countFor(s._id));
}

export async function regeneratePasscode(user: UserDoc, id: string) {
  const s = await getOwned(user, id);
  if (s.verification !== 'passcode') throw new HttpError(409, 'CONFLICT', 'This session does not use a passcode.');
  if ((await countFor(s._id)) > 0) throw new HttpError(409, 'SESSION_LOCKED', 'The passcode is locked after the first check-in.');
  const passcode = generatePasscode();
  s.passcodeHash = hashSecret(passcode);
  await s.save();
  return { passcode };
}

export async function duplicateSession(user: UserDoc, id: string) {
  const s = await getOwned(user, id);
  const passcode = s.verification === 'passcode' ? generatePasscode() : undefined;
  const copy = await Session.create({
    creator: user._id,
    title: `${s.title} (copy)`,
    description: s.description,
    venue: s.venue,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    location: { type: 'Point', coordinates: [...s.location!.coordinates] },
    radius: s.radius,
    verification: s.verification,
    passcodeHash: passcode ? hashSecret(passcode) : undefined,
    linkToken: randomToken(),
    allowedEmails: [...s.allowedEmails],
    sheet: s.sheet ?? null,
  });
  return { session: creatorDto(copy, 0), passcode };
}

export async function removeSession(user: UserDoc, id: string) {
  const s = await getOwned(user, id);
  await CheckIn.deleteMany({ session: s._id });
  await s.deleteOne();
}

export async function setSheet(user: UserDoc, id: string, sheet: Record<string, unknown>) {
  const s = await getOwned(user, id);
  if (s.sheetLocked) {
    throw new HttpError(409, 'SESSION_LOCKED', 'The sheet design is locked after the first check-in.');
  }
  s.sheet = sheet;
  await s.save();
  return sheet;
}

/**
 * Get attendance sheet data for participants to view
 * Uses linkToken instead of database _id
 * No location verification required - read-only access
 */
export async function getAttendanceSheetData(linkToken: string) {
  const session = await Session.findOne({ linkToken });
  if (!session) {
    throw new HttpError(404, 'NOT_FOUND', 'Session not found.');
  }

  // Get all check-ins for this session
  const checkIns = await CheckIn.find({ session: session._id })
    .populate('user', 'name email avatar')
    .sort({ checkedInAt: 1 })
    .lean();

  // Return session info and records
  return {
    session: creatorDto(session, checkIns.length),
    records: checkIns.map((ci: any) => ({
      id: ci._id.toString(),
      name: ci.user?.name || ci.customFields?.name || 'Anonymous',
      email: ci.user?.email || ci.customFields?.email || '',
      time: ci.checkedInAt,
      late: ci.late,
      manual: ci.manual || false,
      distance: ci.distance,
      accuracy: ci.accuracy,
      customFields: ci.customFields || {},
      signature: ci.signature || null,
    })),
  };
}
