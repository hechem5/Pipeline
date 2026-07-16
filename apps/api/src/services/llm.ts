import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Exported interfaces ──────────────────────────────────────────────────────

export interface FitScoreResult {
  fitScore: number;
  rationale: string;
}

export interface TailorResult {
  tailoredCv: Record<string, unknown>;
  coverLetter: string;
}

// ─── Client initialisation ────────────────────────────────────────────────────

// Clients are initialised lazily per call rather than at module load so that
// the app starts cleanly even when API keys are placeholders or missing.

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('LLM_KEY_MISSING: GROQ_API_KEY is not configured');
  }
  return new Groq({ apiKey });
}

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('LLM_KEY_MISSING: GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Call Groq with llama-3.3-70b-versatile.
 * Returns the raw text content of the first choice.
 */
export async function callGroq(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned an empty response');
  }
  return content;
}

/**
 * Call Gemini Flash (gemini-1.5-flash) as a fallback.
 * Returns the raw text content of the response.
 */
export async function callGemini(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
}

/**
 * Try Groq first; on any error (rate limit, missing key, network) fall back
 * to Gemini Flash.
 */
export async function callWithFallback(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  try {
    return await callGroq(prompt, systemPrompt);
  } catch (groqError) {
    const msg = groqError instanceof Error ? groqError.message : String(groqError);
    console.warn(`[llm] Groq failed (${msg}), falling back to Gemini…`);
    return callGemini(prompt, systemPrompt);
  }
}

// ─── Embedding ────────────────────────────────────────────────────────────────

/**
 * Generate a text embedding using Gemini's text-embedding-004 model.
 *
 * NOTE: text-embedding-004 produces 768-dimensional vectors.
 * The Prisma schema uses vector(768) to match this.
 * Drop-in replacement point: swap with an OpenAI text-embedding-3-large call
 * (1536 dims) and update the schema to vector(1536) if you need higher dims.
 *
 * @returns number[] of length 768
 */
export async function embed(text: string): Promise<number[]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'text-embedding-004' });

  const result = await model.embedContent(text);
  const values = result.embedding.values;

  if (!values || values.length === 0) {
    throw new Error('Gemini embedding returned empty values');
  }

  return values; // 768 dimensions
}

// ─── Score fit ────────────────────────────────────────────────────────────────

const FIT_SCORE_SYSTEM_PROMPT = `You are an expert technical recruiter and career coach.
You will be given a candidate's CV (as structured JSON) and a job description.
Your task is to score how well the candidate fits the role on a scale of 0–100,
where 0 = no fit and 100 = perfect fit.

Respond with ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "fitScore": <integer 0-100>,
  "rationale": "<one paragraph explaining the score>"
}`;

/**
 * Score how well a CV matches a job description.
 * Uses Groq → Gemini fallback.
 */
export async function scoreFit(
  cvData: object,
  jobDescription: string
): Promise<FitScoreResult> {
  const prompt = `CV DATA (JSON):\n${JSON.stringify(cvData, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  const raw = await callWithFallback(prompt, FIT_SCORE_SYSTEM_PROMPT);

  // Strip markdown code fences if model wraps JSON in them
  const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

  let parsed: FitScoreResult;
  try {
    parsed = JSON.parse(cleaned) as FitScoreResult;
  } catch {
    throw new Error(`[llm] scoreFit: failed to parse LLM response as JSON.\nRaw: ${raw}`);
  }

  if (typeof parsed.fitScore !== 'number' || typeof parsed.rationale !== 'string') {
    throw new Error(`[llm] scoreFit: unexpected response shape: ${cleaned}`);
  }

  return { fitScore: Math.round(parsed.fitScore), rationale: parsed.rationale };
}

// ─── Tailor CV ────────────────────────────────────────────────────────────────

const TAILOR_SYSTEM_PROMPT = `You are an expert career coach and resume writer.
You will be given a candidate's CV (as structured JSON) and a job description.
Your task is to tailor the CV and write a cover letter.

CRITICAL RULES — you MUST follow these without exception:
1. DO NOT invent, fabricate, or add any skills, employers, job titles, dates, certifications, or credentials that are not already present in the original CV.
2. You may ONLY reorder bullet points, rephrase existing bullets, and emphasise skills/experiences that are already documented.
3. The cover letter must be professional, concise (3–4 paragraphs), and truthful — based solely on the information in the CV.
4. DO NOT hallucinate. If a skill is not in the CV, do not add it to the tailored CV.

Respond with ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "tailoredCv": { ...same structure as the input CV JSON, bullets reordered/rephrased... },
  "coverLetter": "<full cover letter text>"
}`;

/**
 * Tailor a CV and generate a cover letter for a specific job description.
 * Uses Groq → Gemini fallback.
 *
 * IMPORTANT: the prompt explicitly forbids fabricating any information.
 */
export async function tailor(
  cvData: object,
  jobDescription: string
): Promise<TailorResult> {
  const prompt = `ORIGINAL CV (JSON):\n${JSON.stringify(cvData, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  const raw = await callWithFallback(prompt, TAILOR_SYSTEM_PROMPT);

  // Strip markdown code fences if model wraps JSON in them
  const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

  let parsed: TailorResult;
  try {
    parsed = JSON.parse(cleaned) as TailorResult;
  } catch {
    throw new Error(`[llm] tailor: failed to parse LLM response as JSON.\nRaw: ${raw}`);
  }

  if (typeof parsed.tailoredCv !== 'object' || typeof parsed.coverLetter !== 'string') {
    throw new Error(`[llm] tailor: unexpected response shape: ${cleaned}`);
  }

  return parsed;
}
