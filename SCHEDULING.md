# Session Scheduling Feature

## Overview
GeoAttend now supports recurring session schedules. Sessions can be configured to **automatically open** on specific days of the week at their scheduled start time, without requiring anyone to manually log in or open the app.

## Features

### 1. Recurring Schedule Configuration
- **Enable/Disable**: Toggle recurring schedule on or off
- **Days of Week**: Select which days (Sunday-Saturday) the session should auto-open
- **Auto-close**: Optionally auto-close at end time (can be disabled for flexible sessions)

### 2. Automatic Session Management
The scheduler runs every minute and:
- **Always auto-opens** sessions on scheduled days at start time
- **Optionally auto-closes** at end time based on setting
- Works completely autonomously - no user action required

## Key Design Decision

**Why is auto-open always enabled?**
When you enable a recurring schedule, the session will **always** auto-open at the start time. There's no checkbox to disable auto-open because:

- If a schedule doesn't auto-open, it serves no purpose
- The whole point of scheduling is automatic opening
- Removing the option makes the UI clearer and simpler

**Why is auto-close optional?**
Auto-close is a checkbox because some sessions have flexible end times:
- ✅ **Checked** (default): Session closes automatically at end time
- ☐ **Unchecked**: You must manually close each session (useful for events that might run longer)

## Implementation Details

### Backend Changes

#### 1. Session Model (`server/src/models/Session.ts`)
Added `schedule` field:
```typescript
schedule: {
  enabled: { type: Boolean, default: false },
  daysOfWeek: { type: [Number], default: [] }, // 0=Sunday, 1=Monday, ..., 6=Saturday
  autoClose: { type: Boolean, default: true },
}
```
Note: When `enabled: true`, the session **always** auto-opens. No separate autoOpen flag needed.

#### 2. Scheduler Service (`server/src/services/scheduler.service.ts`)
Enhanced with two functions:
- `checkScheduledSessions()`: Opens sessions matching current day of week
- `checkExpiredSessionsInternal()`: Closes expired sessions (respects autoClose setting)

The scheduler checks:
- Current day matches session's `daysOfWeek` array
- Current time is within 2 minutes of session start time
- Session status is 'Closed' (to avoid re-opening already open sessions)
- Session is scheduled for today

#### 3. Validation Schema (`server/src/schemas.ts`)
- Added `schedule` object validation with days array (0-6)
- Validates at least one day is selected when schedule is enabled

### Frontend Changes

#### 1. Types (`client/src/types.ts`)
Added schedule to `CreatorSession` and `SessionInput` interfaces:
```typescript
schedule?: {
  enabled: boolean;
  daysOfWeek: number[];
  autoClose: boolean;
}
```

#### 2. Create Page (`client/src/pages/CreatePage.tsx`)
Added schedule configuration UI:
- Checkbox to enable recurring schedule
- Day selector (visual buttons for each day)
- Auto-close checkbox with explanation
- Clear messaging: "Opens automatically at start time on selected days"
- Validation to require at least one day when enabled

#### 3. Manage Page (`client/src/pages/ManagePage.tsx`)
- Display scheduled days on session dashboard with badges
- Show "Opens automatically at start time" (always true when scheduled)
- Show auto-close status
- Edit schedule in EditView component
- Same clean UI as CreatePage for editing

## Usage

### Creating a Scheduled Session

1. Go to "New session" page
2. Fill in session details (title, venue, time, location, verification)
3. In the "Schedule (Optional)" section:
   - Check "Enable recurring schedule"
   - Select days of the week (e.g., Mon, Tue, Wed, Thu, Fri for weekdays)
   - Choose auto-open/auto-close preferences
4. Publish the session

### Editing a Schedule

1. Go to the session's management page
2. Click "Edit"
3. In the schedule section, modify:
   - Enable/disable schedule
   - Change selected days
   - Toggle auto-open/auto-close
4. Save changes

### How It Works

For a session scheduled on Monday, Wednesday, and Friday from 9:00 AM to 10:00 AM:

**Monday 8:58 AM**: Scheduler checks but too early
**Monday 9:00 AM**: Scheduler auto-opens the session (status → Open)
**Monday 10:00 AM**: Scheduler auto-closes the session (status → Closed)
**Tuesday**: No action (not a scheduled day)
**Wednesday 9:00 AM**: Scheduler auto-opens again
**Wednesday 10:00 AM**: Scheduler auto-closes

## Technical Notes

### Timing Window
- Sessions auto-open within a 4-minute window: 2 minutes before to 2 minutes after start time
- This prevents missing the exact start time due to scheduler running every minute

### Status Management
- Only Closed sessions are auto-opened (prevents re-opening manually closed sessions)
- Manual status changes (Open/Close) are preserved until the next scheduled event

### Scheduler Reliability
- Runs as a cron job every minute
- Uses MongoDB native queries for reliability
- Logs all auto-open/auto-close actions
- Continues working even if individual session updates fail

### Auto-Close Behavior (Important!)
**Only scheduled sessions are auto-closed:**
- ✅ Schedule enabled + autoClose ON → Auto-closes at end time
- ⏸️ Schedule enabled + autoClose OFF → Must manually close
- ❌ No schedule → **Never auto-closes**, must manually close

**Why this matters:**
If you manually open a session past its end time, it will stay open until you manually close it (unless it has a schedule with autoClose enabled). This gives you full control over non-scheduled sessions.

### Migration
Existing sessions without schedule data continue to work normally:
- `schedule.enabled` defaults to `false`
- No automatic opening/closing occurs
- Can be edited to add schedule later

## Example Use Cases

1. **Daily Class Attendance**: Auto-open Monday-Friday at class time
2. **Weekly Meetings**: Auto-open every Monday at meeting time
3. **Weekend Events**: Auto-open Saturday and Sunday only
4. **Flexible Hours**: Auto-open but manual close (disable autoClose)

## Future Enhancements

Possible improvements:
- Different times for different days
- Recurring end date (stop after specific date)
- Multiple time slots per day
- Holiday exceptions
- Time zone handling for distributed teams
