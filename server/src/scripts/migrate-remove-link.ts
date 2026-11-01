import mongoose from 'mongoose';
import { env } from '../config/env.js';

/**
 * Migration: Remove 'link' verification type
 * 
 * This script updates all sessions with verification='link' to verification='location'.
 * Run this once after removing 'link' from the VERIFICATIONS enum.
 * 
 * Usage: npm run migrate:remove-link
 */
async function migrate() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected');

    // First, let's check if there are any sessions with verification='link'
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    
    const sessionsCollection = db.collection('sessions');
    const linkSessions = await sessionsCollection.find({ verification: 'link' }).toArray();
    
    console.log(`\nFound ${linkSessions.length} session(s) with verification='link'`);
    
    if (linkSessions.length > 0) {
      console.log('\nSessions to update:');
      linkSessions.forEach((s: any) => {
        console.log(`  - ${s._id}: "${s.title}" (status: ${s.status})`);
      });
    }

    // Update all sessions with verification='link' to verification='location'
    const result = await sessionsCollection.updateMany(
      { verification: 'link' },
      { $set: { verification: 'location' } }
    );

    console.log(`\n✅ Migration complete!`);
    console.log(`   Sessions matched: ${result.matchedCount}`);
    console.log(`   Sessions updated: ${result.modifiedCount}`);
    
    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      console.log(`\n   ℹ️  No sessions with verification='link' found.`);
    } else {
      console.log(`\n   ✅ All 'link' sessions are now 'location' sessions.`);
      console.log(`   ℹ️  They still have their linkToken for QR code sharing.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
