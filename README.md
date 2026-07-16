# Pipeline 🚀

An automatic job application tracker with AI-assisted tailoring.

## Overview

Pipeline consists of three parts:
1. **API (`apps/api`)**: Express backend that uses Prisma with Supabase (PostgreSQL + pgvector) for storage, and an LLM service (Groq + Gemini fallback) for parsing and tailoring CVs.
2. **Web Dashboard (`apps/web`)**: Next.js App Router dashboard using a custom design system, Tailwind CSS, shadcn/ui, and NextAuth.
3. **Chrome Extension (`apps/extension`)**: Manifest V3 extension built with React and Vite. It automatically detects submitted job applications across major platforms (LinkedIn, Greenhouse, Lever, Workday, iCIMS, Indeed) and syncs them to your dashboard.

## Setup Instructions

### 1. Database & Environment Variables
1. **Supabase**: Create a new project in Supabase (which has `pgvector` enabled by default). Get your connection string (Session mode).
2. Set up environment variables at the root of the project:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in:
   - `DATABASE_URL`: Your Supabase connection string
   - `JWT_SECRET`: Generate a random string (e.g., using `openssl rand -base64 32`)
   - `NEXTAUTH_SECRET`: Generate a random string
   - `GROQ_API_KEY`: Your Groq API key (optional, can be a placeholder for dev)
   - `GEMINI_API_KEY`: Your Gemini API key (optional, can be a placeholder for dev)

*(Note: The app is designed to boot cleanly even if the LLM API keys are placeholders. It will use mock CV parsing data if keys are missing.)*

### 2. Install Dependencies
Run the following from the root directory to install dependencies for all workspaces:
```bash
npm install
```

### 3. Initialize the Database
Push the Prisma schema to your Supabase instance:
```bash
cd apps/api
npx prisma db push
npx prisma generate
cd ../..
```

### 4. Running Locally
You can run the API and Web apps simultaneously from the root using npm workspaces (or in separate terminal tabs):

**Terminal 1 (API)**:
```bash
npm run dev --workspace=pipeline-api
# API runs on http://localhost:3001
```

**Terminal 2 (Web)**:
```bash
npm run dev --workspace=pipeline-web
# Web dashboard runs on http://localhost:3000
```

### 5. Loading the Chrome Extension
1. Build the extension:
   ```bash
   npm run build --workspace=pipeline-extension
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the `apps/extension/dist` folder.
5. Pin the extension to your toolbar. Clicking it will open the popup, where you can log in (make sure the API and Web app are running).

## How to Test Auto-tracking
1. Log in via the web dashboard.
2. Log in via the extension popup.
3. Visit a supported job board (e.g., LinkedIn Easy Apply) and submit an application.
4. The extension will passively detect the confirmation phrase and sync it to your dashboard!

## Notes on Architecture
- **Vector Embeddings**: The system uses 768-dimensional vectors to match the `text-embedding-004` output from Gemini. If you swap to OpenAI, update the Prisma schema to `vector(1536)`.
- **"Auto-fill Only" Constraint**: The extension enforces a strict rule where it will ONLY auto-fill text inputs. It will NEVER click a third-party submit button automatically. You must manually submit the form on the provider's site after reviewing the AI's tailored inputs.
