import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { MAX_RADIUS } from '../config/env.js';

export const VERIFICATIONS = ['location', 'passcode', 'email'] as const;
export const STATUSES = ['Open', 'Closed', 'Cancelled'] as const;

const sessionSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    venue: { type: String, required: true, trim: true, maxlength: 160 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'Open' },
    // GeoJSON point, order is [lng, lat]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    radius: { type: Number, required: true, min: 1, max: MAX_RADIUS },
    verification: { type: String, enum: VERIFICATIONS, required: true },
    passcodeHash: { type: String },
    linkToken: { type: String, required: true },
    allowedEmails: { type: [String], default: [] },
    lateAfterTime: { type: Date }, // Optional: specific time to mark as late (if not set, no late marking)
    sheet: { type: Schema.Types.Mixed, default: null }, // printable sheet design settings
    sheetLocked: { type: Boolean, default: false }, // locked after first check-in, prevents editing
  },
  { timestamps: true },
);

sessionSchema.index({ location: '2dsphere' });
sessionSchema.index({ status: 1, startsAt: 1, endsAt: 1 });

export type SessionDoc = HydratedDocument<InferSchemaType<typeof sessionSchema>>;
export const Session = model('Session', sessionSchema);
