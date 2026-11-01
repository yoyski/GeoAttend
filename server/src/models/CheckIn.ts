import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';

const checkInSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' }, // absent for manual records
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  at: { type: Date, required: true, default: () => new Date() },
  distance: { type: Number }, // metres from the venue pin (not set for manual records)
  accuracy: { type: Number }, // GPS accuracy in metres (not set for manual records)
  late: { type: Boolean, default: false },
  manual: { type: Boolean, default: false },
  customFields: { type: Map, of: String, default: {} }, // Custom column data filled by attendee
  signature: { type: String, default: '' }, // Digital signature (PNG data URL)
});

// One check-in per user per session. Manual records have no user, so they are excluded.
checkInSchema.index(
  { session: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } },
);

export type CheckInDoc = HydratedDocument<InferSchemaType<typeof checkInSchema>>;
export const CheckIn = model('CheckIn', checkInSchema);
