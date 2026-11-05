import cron from 'node-cron';
import { Session } from '../models/Session.js';
import { liveHub } from './live.service.js';

/**
 * Automatically opens and closes sessions based on schedule and time.
 * Runs every minute to check for expired sessions and scheduled openings.
 */
export function startScheduler() {
  // Run every minute: check for sessions that need to be opened or closed
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      await checkScheduledSessions(now);
      await checkExpiredSessionsInternal(now);
    } catch (error) {
      console.error('[Scheduler] Error in scheduled tasks:', error);
    }
  });

  console.log('[Scheduler] Scheduler started (runs every minute for auto-open and auto-close)');
}

/**
 * Check for scheduled sessions that should be opened now.
 */
async function checkScheduledSessions(now: Date) {
  try {
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Find sessions with schedules enabled that match today's day of week
    const scheduledSessions = await Session.collection.find({
      'schedule.enabled': true,
      'schedule.daysOfWeek': currentDay,
      status: 'Closed', // Only open closed sessions
    }).toArray();

    for (const session of scheduledSessions) {
      try {
        const startsAt = new Date(session.startsAt);
        const endsAt = new Date(session.endsAt);
        
        // Check if current time is within the session window (within 2 minutes of start to avoid missing)
        const startWindow = new Date(startsAt.getTime() - 2 * 60 * 1000); // 2 minutes before
        const endWindow = new Date(startsAt.getTime() + 2 * 60 * 1000); // 2 minutes after
        
        if (now >= startWindow && now <= endWindow && now < endsAt) {
          // Open the session - schedule enabled means it should always auto-open
          await Session.collection.updateOne(
            { _id: session._id },
            { $set: { status: 'Open' } }
          );
          
          liveHub.publish(String(session._id), 'status', { status: 'Open' });
          console.log(`[Scheduler] Auto-opened scheduled session: ${session._id} - "${session.title}"`);
        }
      } catch (err) {
        console.error(`[Scheduler] Error opening scheduled session ${session._id}:`, err);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking scheduled sessions:', error);
  }
}

/**
 * Check for sessions that should be auto-closed.
 */
async function checkExpiredSessionsInternal(now: Date) {
  try {
    // Find all Open sessions where endsAt has passed
    const expiredSessions = await Session.collection.find({
      status: 'Open',
      endsAt: { $lte: now },
    }).toArray();

    if (expiredSessions.length > 0) {
      console.log(`[Scheduler] Found ${expiredSessions.length} expired session(s), checking auto-close rules`);
      
      for (const session of expiredSessions) {
        try {
          // Only auto-close if:
          // 1. Session has schedule enabled AND
          // 2. autoClose is true (or not set, defaults to true)
          const hasSchedule = session.schedule?.enabled === true;
          const autoClose = session.schedule?.autoClose !== false; // true by default
          const shouldClose = hasSchedule && autoClose;
          
          if (shouldClose) {
            await Session.collection.updateOne(
              { _id: session._id },
              { $set: { status: 'Closed' } }
            );
            
            liveHub.publish(String(session._id), 'status', { status: 'Closed' });
            console.log(`[Scheduler] Auto-closed scheduled session: ${session._id} - "${session.title}"`);
          } else if (hasSchedule) {
            console.log(`[Scheduler] Skipped auto-close (autoClose disabled): ${session._id} - "${session.title}"`);
          }
          // Non-scheduled sessions are never auto-closed - must be closed manually
        } catch (err) {
          console.error(`[Scheduler] Error closing session ${session._id}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error auto-closing sessions:', error);
  }
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
    console.log(`[Scheduler] Found ${expiredSessions.length} expired session(s), checking auto-close rules`);
    
    for (const session of expiredSessions) {
      try {
        // Only auto-close scheduled sessions with autoClose enabled
        const hasSchedule = session.schedule?.enabled === true;
        const autoClose = session.schedule?.autoClose !== false;
        const shouldClose = hasSchedule && autoClose;
        
        if (shouldClose) {
          await Session.collection.updateOne(
            { _id: session._id },
            { $set: { status: 'Closed' } }
          );
          liveHub.publish(String(session._id), 'status', { status: 'Closed' });
        }
      } catch (err) {
        console.error(`[Scheduler] Error closing session ${session._id}:`, err);
      }
    }
  }

  return expiredSessions.length;
}
