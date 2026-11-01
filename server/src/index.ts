import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { CheckIn } from './models/CheckIn.js';
import { Session } from './models/Session.js';
import { User } from './models/User.js';
import { checkExpiredSessions, startScheduler } from './services/scheduler.service.js';

async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected');
    // Make sure the 2dsphere and unique indexes exist before serving requests.
    await Promise.all([User.init(), Session.init(), CheckIn.init()]);
    
    // Check for any already-expired sessions on startup
    const closedCount = await checkExpiredSessions();
    if (closedCount > 0) {
      console.log(`[Startup] Closed ${closedCount} expired session(s)`);
    }
    
    // Start the auto-close scheduler
    startScheduler();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

   const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use. Stop the other process or change PORT in .env.`);
    process.exit(1);
  }
  throw err;
});

  const shutdown = () => {
  setTimeout(() => process.exit(1), 5000).unref();
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
};
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
