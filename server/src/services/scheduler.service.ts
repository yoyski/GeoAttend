import cron from 'node-cron';
import { Session } from '../models/Session.js';
import { liveHub } from './live.service.js';

/**
 * Automatically closes sessions when their end time is reached.
 * Runs every minute to check for expired sessions.
 */
export function startScheduler() {
  // Run every minute: check for Open sessions that have passed their endsAt time
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find all Open sessions where endsAt has passed
      // Use raw MongoDB query to avoid loading invalid documents
      const expiredSessions = await Session.collection.find({
        status: 'Open',
        endsAt: { $lte: now },
      }).toArray();

      if (expiredSessions.length > 0) {
        console.log(`[Scheduler] Auto-closing ${expiredSessions.length} expired session(s)`);
        
        // Close each expired session using direct MongoDB update to avoid Mongoose validation
        for (const session of expiredSessions) {
          try {
            await Session.collection.updateOne(
              { _id: session._id },
              { $set: { status: 'Closed' } }
            );
            
            // Notify live viewers that the session was closed
            liveHub.publish(String(session._id), 'status', { status: 'Closed' });
            
            console.log(`[Scheduler] Closed session: ${session._id} - "${session.title}"`);
          } catch (err) {
            console.error(`[Scheduler] Error closing session ${session._id}:`, err);
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error auto-closing sessions:', error);
    }
  });

  console.log('[Scheduler] Auto-close scheduler started (runs every minute)');
}

/**
 * Manually trigger a check for expired sessions (useful for testing or startup).
 */
export async function checkExpiredSessions() {
  const now = new Date();
  
  // Use raw MongoDB query to avoid loading invalid documents
  const expiredSessions = await Session.collection.find({
    status: 'Open',
    endsAt: { $lte: now },
  }).toArray();

  if (expiredSessions.length > 0) {
    console.log(`[Scheduler] Found ${expiredSessions.length} expired session(s), closing now`);
    
    for (const session of expiredSessions) {
      try {
        await Session.collection.updateOne(
          { _id: session._id },
          { $set: { status: 'Closed' } }
        );
        liveHub.publish(String(session._id), 'status', { status: 'Closed' });
      } catch (err) {
        console.error(`[Scheduler] Error closing session ${session._id}:`, err);
      }
    }
  }

  return expiredSessions.length;
}
