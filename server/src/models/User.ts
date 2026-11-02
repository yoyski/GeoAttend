import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, sparse: true },
    passwordHash: { type: String, required: false }, // Optional for OAuth users
    verified: { type: Boolean, default: false },
    avatar: { type: String, default: null }, // data URL or path to avatar image
    verificationToken: { type: String, default: null }, // hash of random token
    verificationExpires: { type: Date, default: null },
    resetToken: { type: String, default: null }, // hash of random token
    resetExpires: { type: Date, default: null },
    googleId: { type: String, unique: true, sparse: true }, // Google OAuth ID
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' }, // Auth provider
    notifications: {
      reminders: { type: Boolean, default: true },
      checkIn: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);
