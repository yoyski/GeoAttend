import { env } from '../config/env.js';
import type { CheckInDoc } from '../models/CheckIn.js';
import type { SessionDoc } from '../models/Session.js';

const point = (s: SessionDoc) => ({
  lat: s.location?.coordinates?.[1] ?? 0,
  lng: s.location?.coordinates?.[0] ?? 0,
});

/** Everything the owner may see. Never includes passcodeHash. */
export function creatorDto(s: SessionDoc, checkInCount: number) {
  return {
    id: s.id as string,
    title: s.title,
    description: s.description,
    venue: s.venue,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    status: s.status,
    location: point(s),
    radius: s.radius,
    verification: s.verification,
    allowedEmails: s.allowedEmails,
    shareLink: `${env.CLIENT_URL}/s/${s.id}?t=${s.linkToken}`,
    sheet: s.sheet ?? null,
    checkInCount,
    locked: checkInCount > 0,
    sheetLocked: s.sheetLocked ?? false,
    createdAt: (s as unknown as { createdAt?: Date }).createdAt,
  };
}

/** What a participant may see, and only after the server confirmed they are inside the radius. */
export function participantDto(s: SessionDoc, distance: number, checkedIn: boolean) {
  return {
    id: s.id as string,
    title: s.title,
    description: s.description,
    venue: s.venue,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    status: s.status,
    location: point(s),
    radius: s.radius,
    verification: s.verification,
    distance: Math.round(distance),
    checkedIn,
    sheet: s.sheet ?? null,
  };
}

export function recordDto(c: CheckInDoc) {
  const custom = c.customFields ? Object.fromEntries(c.customFields) : {};
  return {
    id: c.id as string,
    name: c.name,
    email: c.email,
    at: c.at,
    distance: c.distance == null ? null : Math.round(c.distance),
    accuracy: c.accuracy == null ? null : Math.round(c.accuracy),
    late: c.late,
    manual: c.manual,
    lowAccuracy: !c.manual && (c.accuracy ?? 0) > 50,
    customFields: Object.keys(custom).length > 0 ? custom : undefined,
    signature: c.signature || undefined,
  };
}
