import { CheckIn } from '../models/CheckIn.js';
import { Session } from '../models/Session.js';
import { User, type UserDoc } from '../models/User.js';

export const userDto = (u: UserDoc) => ({
  id: u.id as string,
  name: u.name,
  email: u.email,
  verified: u.verified,
  avatar: u.avatar ?? null,
  notifications: { reminders: u.notifications?.reminders ?? true, checkIn: u.notifications?.checkIn ?? false },
});

export async function updateMe(
  user: UserDoc,
  patch: { name?: string; avatar?: string | null; notifications?: { reminders?: boolean; checkIn?: boolean } },
) {
  if (patch.name !== undefined) user.name = patch.name;
  if (patch.avatar !== undefined) user.avatar = patch.avatar;
  if (patch.notifications?.reminders !== undefined) user.set('notifications.reminders', patch.notifications.reminders);
  if (patch.notifications?.checkIn !== undefined) user.set('notifications.checkIn', patch.notifications.checkIn);
  await user.save();
  return userDto(user);
}

export async function deleteMe(user: UserDoc) {
  const mine = await Session.find({ creator: user._id }).distinct('_id');
  await CheckIn.deleteMany({ $or: [{ user: user._id }, { session: { $in: mine } }] });
  await Session.deleteMany({ creator: user._id });
  await User.deleteOne({ _id: user._id });
}

export async function history(user: UserDoc) {
  const rows = await CheckIn.find({ user: user._id }).sort({ at: -1 }).populate('session', 'title venue');
  const items = rows.map((r) => {
    const s = r.session as unknown as { _id: unknown; title?: string; venue?: string } | null;
    return {
      id: r.id as string,
      sessionId: s ? String(s._id) : null,
      title: s?.title ?? 'Deleted session',
      venue: s?.venue ?? '',
      at: r.at,
      distance: r.distance == null ? null : Math.round(r.distance),
      accuracy: r.accuracy == null ? null : Math.round(r.accuracy),
      late: r.late,
    };
  });
  return { attended: items.length, history: items };
}
