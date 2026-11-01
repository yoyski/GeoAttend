import { CheckIn } from '../models/CheckIn.js';
import type { UserDoc } from '../models/User.js';
import { toCsv } from '../utils/csv.js';
import { HttpError } from '../utils/httpError.js';
import { recordDto } from './dto.js';
import { liveHub } from './live.service.js';
import { getOwned } from './session.service.js';

export async function listRecords(user: UserDoc, id: string) {
  const s = await getOwned(user, id);
  const docs = await CheckIn.find({ session: s._id }).sort({ at: 1 });
  const records = docs.map(recordDto);
  const have = new Set(records.map((r) => r.email).filter(Boolean));
  const expected = s.verification === 'email' ? s.allowedEmails.length : null;
  const absent = s.verification === 'email' ? s.allowedEmails.filter((e) => !have.has(e)) : [];
  return { summary: { count: records.length, expected, absent }, records };
}

export async function addManual(user: UserDoc, id: string, input: { name: string; email?: string }) {
  const s = await getOwned(user, id);
  const record = await CheckIn.create({
    session: s._id,
    name: input.name,
    email: input.email ?? '',
    at: new Date(),
    manual: true,
  });
  const dto = recordDto(record);
  liveHub.publish(s.id, 'checkin', dto);
  return dto;
}

export async function removeRecord(user: UserDoc, id: string, recordId: string) {
  const s = await getOwned(user, id);
  const res = await CheckIn.deleteOne({ _id: recordId, session: s._id });
  if (res.deletedCount === 0) throw new HttpError(404, 'NOT_FOUND', 'Record not found.');
  liveHub.publish(s.id, 'removed', { id: recordId });
}

export async function exportCsv(user: UserDoc, id: string) {
  const s = await getOwned(user, id);
  const records = (await CheckIn.find({ session: s._id }).sort({ at: 1 })).map(recordDto);
  const rows: (string | number | boolean | null)[][] = [
    ['Name', 'Email', 'Time', 'Distance (m)', 'Accuracy (m)', 'Status'],
    ...records.map((r) => [
      r.name,
      r.email,
      new Date(r.at).toISOString(),
      r.distance,
      r.accuracy,
      r.manual ? 'Manual' : r.late ? 'Late' : 'Present',
    ]),
  ];
  return { filename: `${s.title.replace(/[^\w-]+/g, '_')}-attendance.csv`, csv: toCsv(rows) };
}
