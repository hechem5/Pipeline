import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// All email routes require authentication
router.use(authenticate);

// ─── POST /email/scan ─────────────────────────────────────────────────────────

/**
 * Stub endpoint for email scanning.
 * Email integration is not yet implemented.
 * Returns 501 Not Implemented.
 */
router.post('/scan', (_req: Request, res: Response): void => {
  res.status(501).json({
    error: 'Email integration not yet available',
    comingSoon: true,
  });
});

// ─── GET /email/status ────────────────────────────────────────────────────────

router.get('/status', (_req: Request, res: Response): void => {
  res.status(200).json({
    connected: false,
    comingSoon: true,
  });
});

export default router;
