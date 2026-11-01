import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as checkInService from '../services/checkIn.service.js';
import * as nearby from '../services/nearby.service.js';
import * as sessions from '../services/session.service.js';
import { liveHub } from '../services/live.service.js';
import { getOwned } from '../services/session.service.js';

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ ok: true, data });
const id = (req: Request) => req.params.id as string;

// Participant
export const nearbyList = async (req: Request, res: Response) =>
  ok(res, await nearby.findNearby(currentUser(req), req.body));
export const participantDetail = async (req: Request, res: Response) =>
  ok(res, await nearby.getForParticipant(req.user || null, id(req), req.query as never));
export const checkIn = async (req: Request, res: Response) =>
  ok(res, await checkInService.checkIn(currentUser(req), id(req), req.body), 201);

// Creator
export const create = async (req: Request, res: Response) =>
  ok(res, await sessions.createSession(currentUser(req), req.body), 201);
export const listMine = async (req: Request, res: Response) =>
  ok(res, await sessions.listMine(currentUser(req), (req.query as { status?: string }).status));
export const getMine = async (req: Request, res: Response) =>
  ok(res, await sessions.getMine(currentUser(req), id(req)));
export const update = async (req: Request, res: Response) =>
  ok(res, await sessions.updateSession(currentUser(req), id(req), req.body));
export const setStatus = (status: 'Open' | 'Closed' | 'Cancelled') => async (req: Request, res: Response) =>
  ok(res, await sessions.setStatus(currentUser(req), id(req), status));
export const duplicate = async (req: Request, res: Response) =>
  ok(res, await sessions.duplicateSession(currentUser(req), id(req)), 201);
export const newPasscode = async (req: Request, res: Response) =>
  ok(res, await sessions.regeneratePasscode(currentUser(req), id(req)));
export const remove = async (req: Request, res: Response) => {
  await sessions.removeSession(currentUser(req), id(req));
  res.status(204).end();
};
export const putSheet = async (req: Request, res: Response) =>
  ok(res, await sessions.setSheet(currentUser(req), id(req), req.body));

// Live attendance (Server-Sent Events). Owner only.
export const live = async (req: Request, res: Response) => {
  const s = await getOwned(currentUser(req), id(req));
  liveHub.subscribe(s.id, res);
};
