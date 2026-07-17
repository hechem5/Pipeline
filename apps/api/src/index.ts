import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import authRouter from './routes/auth';
import applicationsRouter from './routes/applications';
import cvRouter from './routes/cv';
import jobsRouter from './routes/jobs';
import emailRouter from './routes/email';
import { startGhostedSweep } from './jobs/ghosted-sweep';

const app = express();

// ─── Security & parsing middleware ────────────────────────────────────────────

app.use(helmet());

const frontendUrlStr = process.env.FRONTEND_URL ?? 'http://localhost:3000,http://localhost:3002';
const frontendUrls = frontendUrlStr.split(',').map((url) => url.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, server-to-server, health checks)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Allow the configured frontend URLs
      if (frontendUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      // Allow Chrome extension origins — the JWT bearer token is the real
      // security gate; CORS alone cannot protect an API that's also hit by
      // the web app and server-side code.
      if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/auth', authRouter);
app.use('/applications', applicationsRouter);
app.use('/cv', cvRouter);
app.use('/jobs', jobsRouter);
app.use('/email', emailRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[unhandled error]', err);

  // Handle multer errors
  if (err.message?.includes('Only PDF')) {
    res.status(415).json({ error: err.message });
    return;
  }

  if (err.message?.includes('File too large')) {
    res.status(413).json({ error: 'File exceeds 5 MB limit' });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.log(`[pipeline-api] Server running on http://localhost:${PORT}`);
  console.log(`[pipeline-api] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[pipeline-api] CORS allowed origins: ${frontendUrlStr}`);

  // Start the daily ghosted sweep cron job
  startGhostedSweep();
});

export default app;
