import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import * as llmService from '../services/llm';

const router = Router();

// All job routes require authentication
router.use(authenticate);

// ─── Validation schema ────────────────────────────────────────────────────────

const JobMatchSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  jobDescription: z.string().min(20, 'Job description is too short'),
  jobUrl: z.string().url().optional().nullable(),
  platform: z.string().optional().nullable(),
});

// ─── POST /jobs/match ─────────────────────────────────────────────────────────

router.post('/match', async (req: Request, res: Response): Promise<void> => {
  const parsed = JobMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { jobTitle, company, jobDescription, jobUrl, platform } = parsed.data;
  const userId = req.userId!;

  // Read the configurable fit score threshold (default 60)
  const threshold = parseInt(process.env.FIT_SCORE_THRESHOLD ?? '60', 10);

  try {
    // ── Step 1: Get user's BaseCv ─────────────────────────────────────────────
    const cv = await prisma.baseCv.findUnique({
      where: { userId },
      select: { id: true, structuredData: true, userId: true },
    });

    if (!cv) {
      res.status(400).json({
        error: 'Upload a CV first',
        code: 'CV_MISSING',
      });
      return;
    }

    // ── Step 2: Embed the job description ─────────────────────────────────────
    let jobEmbedding: number[];
    try {
      jobEmbedding = await llmService.embed(jobDescription);
    } catch (embedErr) {
      const msg = embedErr instanceof Error ? embedErr.message : String(embedErr);
      console.error('[jobs/match] Embedding failed:', msg);
      res.status(502).json({
        error: 'Embedding service unavailable',
        details: msg,
        code: 'EMBED_FAILED',
      });
      return;
    }

    // ── Step 3: pgvector cosine similarity (cv embedding vs job embedding) ────
    // Raw query because Prisma doesn't natively support pgvector operators.
    // Uses <=> (cosine distance) operator: similarity = 1 - distance.
    const vectorLiteral = `[${jobEmbedding.join(',')}]`;

    const similarityRows = await prisma.$queryRawUnsafe<
      Array<{ similarity: number }>
    >(
      `SELECT 1 - (embedding <=> $1::vector) AS similarity
       FROM "BaseCv"
       WHERE "userId" = $2
       LIMIT 1`,
      vectorLiteral,
      userId
    );

    let preliminaryScore = 0;
    if (similarityRows.length > 0 && similarityRows[0].similarity != null) {
      // Cosine similarity is 0–1; convert to 0–100 scale
      preliminaryScore = Math.round(similarityRows[0].similarity * 100);
    }

    // ── Step 4: Below threshold — skip LLM ───────────────────────────────────
    if (preliminaryScore < threshold) {
      res.status(200).json({
        match: false,
        fitScore: preliminaryScore,
        reason: 'Below threshold',
      });
      return;
    }

    // ── Step 5: LLM fit scoring ───────────────────────────────────────────────
    let fitResult: llmService.FitScoreResult;
    try {
      fitResult = await llmService.scoreFit(cv.structuredData as object, jobDescription);
    } catch (llmErr) {
      const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      console.error('[jobs/match] scoreFit failed:', msg);
      res.status(502).json({
        error: 'LLM service unavailable',
        details: msg,
        code: 'LLM_FAILED',
      });
      return;
    }

    // ── Step 6: Still below threshold after LLM ───────────────────────────────
    if (fitResult.fitScore < threshold) {
      res.status(200).json({
        match: false,
        fitScore: fitResult.fitScore,
        rationale: fitResult.rationale,
      });
      return;
    }

    // ── Step 7: Above threshold — tailor CV ──────────────────────────────────
    let tailorResult: llmService.TailorResult;
    try {
      tailorResult = await llmService.tailor(cv.structuredData as object, jobDescription);
    } catch (tailorErr) {
      const msg = tailorErr instanceof Error ? tailorErr.message : String(tailorErr);
      console.error('[jobs/match] tailor failed:', msg);
      res.status(502).json({
        error: 'LLM tailoring service unavailable',
        details: msg,
        code: 'TAILOR_FAILED',
      });
      return;
    }

    // ── Step 8: Create Application record ────────────────────────────────────
    const application = await prisma.application.create({
      data: {
        userId,
        company,
        jobTitle,
        jobUrl: jobUrl ?? null,
        platform: platform ?? null,
        status: 'APPLIED',
        source: 'AI_TAILORED',
        fitScore: fitResult.fitScore,
        coverLetterText: tailorResult.coverLetter,
      },
    });

    // Insert the vector using raw SQL
    await prisma.$executeRawUnsafe(
      `UPDATE "Application" SET "jobEmbedding" = $1::vector WHERE id = $2`,
      vectorLiteral,
      application.id
    );

    // ── Step 9: Return the full result ────────────────────────────────────────
    res.status(200).json({
      match: true,
      fitScore: fitResult.fitScore,
      rationale: fitResult.rationale,
      tailoredCv: tailorResult.tailoredCv,
      coverLetter: tailorResult.coverLetter,
      applicationId: application.id,
    });
  } catch (err) {
    console.error('[jobs/match]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
