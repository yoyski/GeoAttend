import type { Response } from 'express';

/** Server-Sent Events hub for the creator's live attendance view (no extra dependency). */
const rooms = new Map<string, Set<Response>>();

export const liveHub = {
  subscribe(sessionId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': connected\n\n');
    const set = rooms.get(sessionId) ?? new Set<Response>();
    set.add(res);
    rooms.set(sessionId, set);
    const beat = setInterval(() => res.write(': ping\n\n'), 25_000);
    res.on('close', () => {
      clearInterval(beat);
      set.delete(res);
      if (set.size === 0) rooms.delete(sessionId);
    });
  },
  publish(sessionId: string, event: string, data: unknown) {
    for (const res of rooms.get(sessionId) ?? []) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  },
};
