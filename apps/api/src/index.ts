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

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
app.use(
  cors({
    origin: frontendUrl,
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
  console.log(`[pipeline-api] CORS allowed origin: ${frontendUrl}`);

  // Start the daily ghosted sweep cron job
  startGhostedSweep();
});

export default app;
