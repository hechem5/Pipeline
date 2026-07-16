import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import * as cvParserService from '../services/cv-parser';
import * as llmService from '../services/llm';

const router = Router();

// All CV routes require authentication
router.use(authenticate);

// ─── Multer configuration ─────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are accepted'));
      return;
    }
    cb(null, true);
  },
});

// ─── POST /cv ─────────────────────────────────────────────────────────────────

router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'A PDF file is required (field name: file)' });
      return;
    }

    try {
      // 1. Parse the PDF into structured JSON
      const structuredData = await cvParserService.parse(req.file.buffer);

      // 2. Generate a text embedding from the CV text
      //    Build a compact text representation for embedding
      const cvText = [
        structuredData.name,
        structuredData.summary ?? '',
        structuredData.skills.join(', '),
        structuredData.experience
          .map((e) => `${e.title} at ${e.company}: ${e.bullets.join('. ')}`)
          .join('\n'),
        structuredData.education
          .map((e) => `${e.degree} from ${e.institution}`)
          .join('\n'),
      ]
        .filter(Boolean)
        .join('\n');

      let embedding: number[] | undefined;
      try {
        embedding = await llmService.embed(cvText);
      } catch (embedErr) {
        // Embedding failure is non-fatal — store CV without vector
        const msg = embedErr instanceof Error ? embedErr.message : String(embedErr);
        console.warn(`[cv/upload] Embedding failed (${msg}), storing without vector`);
      }

      // 3. Upsert the BaseCv record for this user
      const baseCv = await prisma.baseCv.upsert({
        where: { userId: req.userId! },
        create: {
          userId: req.userId!,
          structuredData: structuredData as object,
          // Store embedding as PostgreSQL vector literal if available
          ...(embedding
            ? { embedding: `[${embedding.join(',')}]` as unknown as undefined }
            : {}),
        },
        update: {
          structuredData: structuredData as object,
          ...(embedding
            ? { embedding: `[${embedding.join(',')}]` as unknown as undefined }
            : {}),
        },
        select: {
          id: true,
          userId: true,
          structuredData: true,
          rawFileUrl: true,
          updatedAt: true,
        },
      });

      res.status(200).json({ baseCv, structuredData });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[cv/upload]', msg);

      if (msg.includes('Only PDF')) {
        res.status(415).json({ error: msg });
        return;
      }

      if (msg.includes('Failed to extract text') || msg.includes('appears to be empty')) {
        res.status(400).json({ error: 'Could not read text from this PDF. Please ensure it is a valid, text-based PDF.' });
        return;
      }

      res.status(500).json({ error: msg });
    }
  }
);

// ─── GET /cv ──────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const baseCv = await prisma.baseCv.findUnique({
      where: { userId: req.userId! },
      select: {
        id: true,
        userId: true,
        structuredData: true,
        rawFileUrl: true,
        updatedAt: true,
      },
    });

    if (!baseCv) {
      res.status(404).json({ error: 'No CV found. Upload one first.' });
      return;
    }

    res.status(200).json(baseCv);
  } catch (err) {
    console.error('[cv/get]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /cv ───────────────────────────────────────────────────────────────

router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.baseCv.findUnique({
      where: { userId: req.userId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'No CV found' });
      return;
    }

    await prisma.baseCv.delete({ where: { userId: req.userId! } });

    res.status(204).send();
  } catch (err) {
    console.error('[cv/delete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
