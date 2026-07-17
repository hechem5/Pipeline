import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// All application routes require authentication
router.use(authenticate);

// ─── Validation schemas ───────────────────────────────────────────────────────

const CreateApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  jobUrl: z.string().url().optional().nullable(),
  platform: z.string().optional().nullable(),
  source: z.enum(['MANUAL', 'AUTO_DETECTED', 'AI_TAILORED']).optional(),
  coverLetterText: z.string().optional().nullable(),
  fitScore: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const UpdateApplicationSchema = z.object({
  company: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  jobUrl: z.string().url().optional().nullable(),
  platform: z.string().optional().nullable(),
  status: z
    .enum(['APPLIED', 'INTERVIEW_SCHEDULED', 'OFFER', 'REJECTED', 'GHOSTED'])
    .optional(),
  source: z.enum(['MANUAL', 'AUTO_DETECTED', 'AI_TAILORED']).optional(),
  tailoredCvUrl: z.string().url().optional().nullable(),
  coverLetterText: z.string().optional().nullable(),
  fitScore: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const ApproveSendSchema = z.object({
  coverLetterText: z.string().optional().nullable(),
  tailoredCvUrl: z.string().url().optional().nullable(),
});

// ─── POST /applications ───────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    // ── Idempotency: if a jobUrl is provided, return existing application ──
    if (parsed.data.jobUrl) {
      // Strip query params from the jobUrl for a looser match (post-apply URLs
      // differ from the original job URL only in the pathname/params)
      const jobUrlBase = parsed.data.jobUrl.split('?')[0].replace(/\/$/, '')

      const existing = await prisma.application.findFirst({
        where: {
          userId: req.userId!,
          // Match on the base URL (ignore query string) so both
          // ?currentJobId=X and /post-apply/...?currentJobId=X dedupe correctly
          jobUrl: { startsWith: jobUrlBase },
        },
        orderBy: { appliedAt: 'desc' },
      });

      if (existing) {
        res.status(200).json(existing);
        return;
      }
    }

    const application = await prisma.application.create({
      data: {
        userId: req.userId!,
        ...parsed.data,
      },
    });

    res.status(201).json(application);
  } catch (err) {
    console.error('[applications/create]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /applications ────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, q } = req.query;

  try {
    const applications = await prisma.application.findMany({
      where: {
        userId: req.userId!,
        ...(status
          ? {
              status: status as
                | 'APPLIED'
                | 'INTERVIEW_SCHEDULED'
                | 'OFFER'
                | 'REJECTED'
                | 'GHOSTED',
            }
          : {}),
        ...(q
          ? {
              OR: [
                { company: { contains: String(q), mode: 'insensitive' } },
                { jobTitle: { contains: String(q), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.status(200).json(applications);
  } catch (err) {
    console.error('[applications/list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /applications/:id ──────────────────────────────────────────────────

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const parsed = UpdateApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    // Verify ownership
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    if (existing.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.application.update({
      where: { id },
      data: parsed.data,
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error('[applications/update]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /applications/:id ─────────────────────────────────────────────────

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  try {
    // Verify ownership
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    if (existing.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.application.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error('[applications/delete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /applications/:id/approve-send ─────────────────────────────────────

router.post('/:id/approve-send', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const parsed = ApproveSendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: 'APPLIED',
        // Only promote source to AI_TAILORED if it was a manual/auto-detected entry
        source:
          existing.source !== 'AI_TAILORED' ? 'AI_TAILORED' : existing.source,
        ...(parsed.data.coverLetterText !== undefined
          ? { coverLetterText: parsed.data.coverLetterText }
          : {}),
        ...(parsed.data.tailoredCvUrl !== undefined
          ? { tailoredCvUrl: parsed.data.tailoredCvUrl }
          : {}),
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error('[applications/approve-send]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
