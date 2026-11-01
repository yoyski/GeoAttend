import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as records from '../services/record.service.js';

const sid = (req: Request) => req.params.id as string;

export const list = async (req: Request, res: Response) =>
  res.json({ ok: true, data: await records.listRecords(currentUser(req), sid(req)) });
export const addManual = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, data: await records.addManual(currentUser(req), sid(req), req.body) });
export const remove = async (req: Request, res: Response) => {
  await records.removeRecord(currentUser(req), sid(req), req.params.recordId as string);
  res.status(204).end();
};
export const exportCsv = async (req: Request, res: Response) => {
  const { filename, csv } = await records.exportCsv(currentUser(req), sid(req));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};
