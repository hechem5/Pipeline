// Drop-in replacement point: swap JWT_SECRET and verification logic here
// to support Recall-compatible auth tokens — just change the secret and
// the claim extraction (sub / userId) to match Recall's token format.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to carry the authenticated userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface JwtPayload {
  sub?: string;
  userId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('[auth] JWT_SECRET is not set — all requests will be rejected');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Drop-in replacement point: replace jwt.verify() here with Recall's
    // token verification SDK call if migrating to Recall-managed auth.
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Support both `sub` (standard JWT claim) and `userId` (legacy)
    const userId = payload.sub ?? payload.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
