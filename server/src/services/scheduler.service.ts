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
        
        // For recurring sessions, compare TIME OF DAY only (not full datetime)
        // Extract hours and minutes from both the stored time and current time
        const startHour = startsAt.getUTCHours();
        const startMinute = startsAt.getUTCMinutes();
        const endHour = endsAt.getUTCHours();
        const endMinute = endsAt.getUTCMinutes();
        
        const nowHour = now.getUTCHours();
        const nowMinute = now.getUTCMinutes();
        
        // Convert to minutes since midnight for easier comparison
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        const nowTimeMinutes = nowHour * 60 + nowMinute;
        
        // Check if current time is within 2 minutes of start time
        const startWindow = startTimeMinutes - 2;
        const endWindow = startTimeMinutes + 2;
        
        // Auto-open if we're within the start window and before the end time
        if (nowTimeMinutes >= startWindow && nowTimeMinutes <= endWindow && nowTimeMinutes < endTimeMinutes) {
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
      console.log(`[Scheduler] Found ${expiredSessions.length} expired session(s)`);
      
      for (const session of expiredSessions) {
        try {
          // Check if this is a scheduled session with autoClose disabled
          const hasSchedule = session.schedule?.enabled === true;
          const autoCloseDisabled = hasSchedule && session.schedule?.autoClose === false;
          
          if (autoCloseDisabled) {
            console.log(`[Scheduler] Skipped auto-close (autoClose disabled): ${session._id} - "${session.title}"`);
            continue;
          }
          
          // Auto-close all other expired sessions (both scheduled and non-scheduled)
          await Session.collection.updateOne(
            { _id: session._id },
            { $set: { status: 'Closed' } }
          );
          
          liveHub.publish(String(session._id), 'status', { status: 'Closed' });
          console.log(`[Scheduler] Auto-closed expired session: ${session._id} - "${session.title}"`);
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

  let closedCount = 0;

  if (expiredSessions.length > 0) {
    console.log(`[Scheduler] Found ${expiredSessions.length} expired session(s)`);
    
    for (const session of expiredSessions) {
      try {
        // Check if this is a scheduled session with autoClose disabled
        const hasSchedule = session.schedule?.enabled === true;
        const autoCloseDisabled = hasSchedule && session.schedule?.autoClose === false;
        
        if (autoCloseDisabled) {
          continue;
        }
        
        // Auto-close all other expired sessions (both scheduled and non-scheduled)
        await Session.collection.updateOne(
          { _id: session._id },
          { $set: { status: 'Closed' } }
        );
        liveHub.publish(String(session._id), 'status', { status: 'Closed' });
        closedCount++;
      } catch (err) {
        console.error(`[Scheduler] Error closing session ${session._id}:`, err);
      }
    }
  }

  return closedCount;
}
