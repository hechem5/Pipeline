import pdfParse from 'pdf-parse';
import { callWithFallback } from './llm';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StructuredCv {
  name: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year?: string;
  }>;
  certifications?: string[];
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const CV_PARSE_SYSTEM_PROMPT = `You are a precise CV/resume parser.
You will be given raw text extracted from a PDF resume.
Your task is to extract structured information and return ONLY valid JSON.

The JSON must exactly follow this schema (no markdown fences, no extra keys, no commentary):
{
  "name": "<full name>",
  "email": "<email or null>",
  "phone": "<phone or null>",
  "summary": "<professional summary or null>",
  "skills": ["<skill1>", "<skill2>", ...],
  "experience": [
    {
      "company": "<company name>",
      "title": "<job title>",
      "startDate": "<e.g. Jan 2022>",
      "endDate": "<e.g. Mar 2024 or 'Present' or null>",
      "bullets": ["<achievement/responsibility 1>", ...]
    }
  ],
  "education": [
    {
      "institution": "<university/college name>",
      "degree": "<degree and field of study>",
      "year": "<graduation year or null>"
    }
  ],
  "certifications": ["<cert1>", "<cert2>"]
}

If a field cannot be determined from the text, use null for optional string fields
or an empty array for array fields. Do not fabricate information.`;

// ─── Mock CV (placeholder mode) ───────────────────────────────────────────────

/**
 * Returns a mock StructuredCv when LLM keys are not configured.
 * This allows the app to run in demo/dev mode without API keys.
 */
function mockStructuredCv(): StructuredCv {
  return {
    name: 'Demo User [LLM keys not configured]',
    email: 'demo@example.com',
    phone: undefined,
    summary:
      'This is a placeholder CV generated because LLM API keys are missing. ' +
      'Set GROQ_API_KEY or GEMINI_API_KEY in your .env file to parse real CVs.',
    skills: ['Please', 'configure', 'GROQ_API_KEY', 'or', 'GEMINI_API_KEY'],
    experience: [
      {
        company: 'Example Corp',
        title: 'Software Engineer',
        startDate: 'Jan 2022',
        endDate: 'Present',
        bullets: [
          'Add your real work history by configuring LLM API keys.',
        ],
      },
    ],
    education: [
      {
        institution: 'Example University',
        degree: 'BSc Computer Science',
        year: '2021',
      },
    ],
    certifications: [],
  };
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse a PDF buffer into a structured CV object.
 *
 * 1. Extracts raw text via pdf-parse.
 * 2. Sends the text to the LLM (Groq → Gemini fallback) for structured extraction.
 * 3. Parses and validates the JSON response.
 *
 * If LLM keys are missing (placeholder mode), returns a mock StructuredCv
 * so the route doesn't crash during development.
 */
export async function parse(pdfBuffer: Buffer): Promise<StructuredCv> {
  // Step 1: Extract raw text from PDF
  let rawText: string;
  try {
    const data = await pdfParse(pdfBuffer);
    rawText = data.text;
  } catch (err) {
    throw new Error(
      `[cv-parser] Failed to extract text from PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!rawText.trim()) {
    throw new Error('[cv-parser] PDF appears to be empty or image-only (no extractable text)');
  }

  // Step 2: Call LLM to structure the text
  let raw: string;
  try {
    raw = await callWithFallback(
      `Here is the raw resume text to parse:\n\n${rawText}`,
      CV_PARSE_SYSTEM_PROMPT
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('LLM_KEY_MISSING')) {
      console.warn('[cv-parser] LLM keys not configured — returning mock CV');
      return mockStructuredCv();
    }
    throw err;
  }

  // Step 3: Parse the JSON response
  const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

  let parsed: StructuredCv;
  try {
    parsed = JSON.parse(cleaned) as StructuredCv;
  } catch {
    throw new Error(
      `[cv-parser] Failed to parse LLM response as JSON.\nRaw response:\n${raw}`
    );
  }

  // Basic shape validation
  if (!parsed.name || !Array.isArray(parsed.skills)) {
    throw new Error(
      `[cv-parser] LLM returned unexpected CV structure: ${cleaned.slice(0, 200)}`
    );
  }

  // Ensure arrays are always arrays (defensive)
  parsed.skills = parsed.skills ?? [];
  parsed.experience = parsed.experience ?? [];
  parsed.education = parsed.education ?? [];
  parsed.certifications = parsed.certifications ?? [];

  return parsed;
}
