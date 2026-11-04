import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import { cacheStrategies } from '../middleware/cache.js';
import * as s from '../controllers/sessions.controller.js';
import * as rec from '../controllers/records.controller.js';
import { checkInLimiter, nearbyLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  checkInBody, createSessionBody, detailQuery, idParams, listMineQuery, manualRecordBody,
  nearbyBody, recordParams, sheetBody, updateSessionBody,
} from '../schemas.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const r = Router();

// Participant - cache nearby sessions for 30 seconds
r.post('/nearby', optionalAuth, nearbyLimiter, cacheStrategies.short, validate({ body: nearbyBody }), h(s.nearbyList));

// Creator (fixed paths first, so "mine" is never read as an :id) - require auth, cache 1 min
r.get('/mine', auth, cacheStrategies.userPrivate, validate({ query: listMineQuery }), h(s.listMine));
r.get('/mine/:id', auth, cacheStrategies.userPrivate, validate({ params: idParams }), h(s.getMine));
r.post('/', auth, validate({ body: createSessionBody }), h(s.create));

// Participant detail - cache 1 minute (optional auth - allows checking location before requiring login)
r.get('/:id', optionalAuth, cacheStrategies.short, validate({ params: idParams, query: detailQuery }), h(s.participantDetail));
// Participant view attendance sheet - no location check required
r.get('/:id/sheet', optionalAuth, cacheStrategies.short, validate({ params: idParams }), h(s.viewAttendanceSheet));
// Check-in requires auth - no cache
r.post('/:id/check-in', auth, checkInLimiter, validate({ params: idParams, body: checkInBody }), h(s.checkIn));

// Creator management - require auth - no cache on mutations
r.patch('/:id', auth, validate({ params: idParams, body: updateSessionBody }), h(s.update));
r.post('/:id/open', auth, validate({ params: idParams }), h(s.setStatus('Open')));
r.post('/:id/close', auth, validate({ params: idParams }), h(s.setStatus('Closed')));
r.post('/:id/cancel', auth, validate({ params: idParams }), h(s.setStatus('Cancelled')));
r.post('/:id/duplicate', auth, validate({ params: idParams }), h(s.duplicate));
r.post('/:id/passcode', auth, validate({ params: idParams }), h(s.newPasscode));
r.put('/:id/sheet', auth, validate({ params: idParams, body: sheetBody }), h(s.putSheet));
r.delete('/:id', auth, validate({ params: idParams }), h(s.remove));

// Records, export and live view (owner only) - require auth
r.get('/:id/records', auth, cacheStrategies.realtime, validate({ params: idParams }), h(rec.list));
r.post('/:id/records', auth, validate({ params: idParams, body: manualRecordBody }), h(rec.addManual));
r.delete('/:id/records/:recordId', auth, validate({ params: recordParams }), h(rec.remove));
r.get('/:id/export.csv', auth, cacheStrategies.none, validate({ params: idParams }), h(rec.exportCsv)); // No cache for CSV export
r.get('/:id/live', auth, cacheStrategies.none, validate({ params: idParams }), h(s.live)); // No cache for SSE

export default r;
