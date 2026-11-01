import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { CheckIn } from '../models/CheckIn.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { hashSecret } from '../utils/hash.js';
import { randomToken } from '../utils/tokens.js';

async function cleanup() {
  const collection = mongoose.connection.collection('sessions');
  const indexes = await collection.indexes();
  
  for (const idx of indexes) {
    const key = idx.key;
    // Drop any 2dsphere indexes on wrong fields (should only be on location)
    const isGeo = Object.values(key).includes('2dsphere');
    const isOnWrongField = isGeo && !key.location;
    
    if (isOnWrongField) {
      const indexName = idx.name;
      if (indexName) {
        console.log(`Dropping bad geospatial index: ${indexName}`);
        await collection.dropIndex(indexName);
      }
    }
  }
}

/** Demo data so the client can be built against real responses. Safe to run repeatedly. */
async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  await Promise.all([User.init(), Session.init(), CheckIn.init()]);
  await cleanup();

  const emails = ['alex@example.com', 'maria@example.com', 'ben@example.com'];
  const password = 'Password123'; // Default password for all test users
  const passwordHash = await bcrypt.hash(password, 12);
  
  const people = await Promise.all(
    [['Alex Rivera', emails[0]], ['Maria Santos', emails[1]], ['Ben Lim', emails[2]]].map(([name, email]) =>
      User.findOneAndUpdate({ email }, { name, email, verified: true, passwordHash }, { upsert: true, new: true }),
    ),
  );
  const alex = people[0]!;

  // Remove previous demo sessions owned by Alex, then recreate them.
  const old = await Session.find({ creator: alex._id }).distinct('_id');
  await CheckIn.deleteMany({ session: { $in: old } });
  await Session.deleteMany({ creator: alex._id });

  const now = Date.now();
  const startsAt = new Date(now - 30 * 60_000);
  const endsAt = new Date(now + 3 * 3600_000);
  const base = { creator: alex._id, startsAt, endsAt, status: 'Open', allowedEmails: [] as string[] };
  const at = (lat: number, lng: number) => ({ type: 'Point' as const, coordinates: [lng, lat] });

  const created = [];
  // All sessions get a linkToken for sharing via QR/link, regardless of verification type
  for (const sessionData of [
    { ...base, title: 'Morning assembly', venue: 'Main hall', location: at(14.5995, 120.9842), radius: 100, verification: 'location', linkToken: randomToken() },
    { ...base, title: 'Team standup', venue: 'Conference room A', location: at(14.6042, 120.9822), radius: 50, verification: 'passcode', passcodeHash: hashSecret('ABCD1234'), linkToken: randomToken() },
    { ...base, title: 'Community event', venue: 'Central plaza', location: at(14.5547, 121.0244), radius: 150, verification: 'email', allowedEmails: [emails[1]!, emails[2]!], linkToken: randomToken() },
    { ...base, title: 'Large Conference', venue: 'Convention Center', location: at(14.5995, 120.9850), radius: 200, verification: 'location', linkToken: randomToken() },
  ]) {
    const s = await Session.create(sessionData);
    created.push(s);
  }

  // Add 55 check-ins to the "Large Conference" session
  const largeConference = created[3]!;
  const checkIns = [];
  
  // First 3 check-ins for the actual users
  checkIns.push({
    session: largeConference._id,
    user: people[0]!._id,
    name: people[0]!.name,
    email: people[0]!.email,
    at: new Date(now - 54 * 2 * 60_000),
    distance: 50,
    accuracy: 15,
    late: false,
    manual: false,
  });
  checkIns.push({
    session: largeConference._id,
    user: people[1]!._id,
    name: people[1]!.name,
    email: people[1]!.email,
    at: new Date(now - 53 * 2 * 60_000),
    distance: 80,
    accuracy: 25,
    late: false,
    manual: false,
  });
  checkIns.push({
    session: largeConference._id,
    user: people[2]!._id,
    name: people[2]!.name,
    email: people[2]!.email,
    at: new Date(now - 52 * 2 * 60_000),
    distance: 120,
    accuracy: 35,
    late: false,
    manual: false,
  });
  
  // Remaining 52 as manual check-ins (no user field, so no duplicate key issues)
  for (let i = 4; i <= 55; i++) {
    checkIns.push({
      session: largeConference._id,
      // no user field for manual check-ins
      name: `Attendee ${i}`,
      email: `attendee${i}@example.com`,
      at: new Date(now - (55 - i) * 2 * 60_000), // Staggered check-ins every 2 minutes
      distance: Math.floor(Math.random() * 180) + 10, // Random distance 10-190m
      accuracy: Math.floor(Math.random() * 40) + 10, // Random accuracy 10-50m
      late: i > 40, // Last 15 are late
      manual: true,
    });
  }
  await CheckIn.insertMany(checkIns);
  await Session.updateOne({ _id: largeConference._id }, { sheetLocked: true });

  console.log('\nSeeded 4 test sessions for alex@example.com');
  console.log('\nTest Users (password: Password123):');
  emails.forEach((e) => console.log(`  ${e}`));
  console.log('\nSessions:');
  for (const s of created) {
    const count = s.id === largeConference.id ? 55 : 0;
    console.log(`  ${s.id}  ${s.verification.padEnd(8)} ${s.title}  [${s.location!.coordinates[1]}, ${s.location!.coordinates[0]}] ${s.radius} m ${count > 0 ? `(${count} check-ins)` : ''}`);
  }
  console.log('\nPasscode for "Team standup" is: ABCD1234\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
