import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { User } from '../models/User.js';
import { getRandomAvatar } from '../utils/avatar.js';

export function configurePassport() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth not configured - skipping passport setup');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${env.SERVER_URL}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Find or create user
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails?.[0]?.value });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.authProvider = 'google';
              user.verified = true; // Google emails are verified
              // Keep existing avatar if user already has one, otherwise assign random
              if (!user.avatar) {
                user.avatar = getRandomAvatar();
              }
              await user.save();
            } else {
              // Create new user with random avatar from app collection
              user = await User.create({
                googleId: profile.id,
                email: profile.emails?.[0]?.value || '',
                name: profile.displayName || 'Google User',
                avatar: getRandomAvatar(), // Always use random avatar from app
                verified: true, // Google emails are verified
                authProvider: 'google',
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
