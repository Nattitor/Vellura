# ✦ Vellura

![Vellura Banner](public/preview.webp) <!-- Placeholder for future screenshot -->

> **The intelligent workspace for your career.**

Vellura is a Full-Stack Micro-SaaS application designed to generate hyper-personalized cover letters and pitches. Built with a focus on **Senior-level engineering standards**, it features real-time AI streaming, robust state management, secure database architecture, and strict "Ethereal Minimalist" design principles.

---

## 🚀 Key Features

*   **Real-Time AI Streaming:** Utilizes the Vercel AI SDK to stream responses chunk-by-chunk, providing immediate visual feedback without long loading spinners.
*   **Model Agnosticism with Resilient Cascade:** Dynamically routes requests through Google Gemini (Speed/Reasoning) with automatic OpenRouter fallback (Nemotron, GLM, Laguna) to avoid provider saturation. Smart short-circuit when OpenRouter rate-limit is hit.
*   **Global User Context:** Users store their base resume/experience in a secure Supabase profile. This context is silently injected into the AI system prompt to eliminate repetitive data entry.
*   **SaaS Mechanics (5 free generations/day):** Functional database-driven daily limit system. Users consume 1 credit per generation, with automatic UTC-midnight reset.
*   **Expert Mode + BYOK:** Power users can connect their own API keys (OpenAI, Anthropic, DeepSeek, OpenRouter, Google) to unlock frontier models with unlimited generations.
*   **Persistent History:** All generated documents are securely saved to a PostgreSQL database (Supabase) with Row Level Security (RLS) enabled. Search, filter by provider/model, paginate, and export.
*   **Professional Export:** Supports rich Markdown rendering and one-click PDF exports (jspdf).
*   **4-Language UI:** Full internationalization (English, Spanish, French, Portuguese) with localized AI output language.

---

## 🛠 Tech Stack

*   **Framework:** Next.js 15.3 (App Router, Turbopack, Server Components, Server Actions)
*   **AI Engine:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
*   **AI Providers:** Google Gemini (system), OpenRouter (free fallback), OpenAI / Anthropic / DeepSeek (BYOK)
*   **Database & Auth:** Supabase (PostgreSQL + SSR Auth + RLS)
*   **Styling:** Tailwind CSS v4 + shadcn/ui (Radix Primitives)
*   **i18n:** Custom context provider (4 languages)

---

## 💻 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/vellura.git
cd vellura
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory with the following keys:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google AI (required — primary provider for the free tier)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key

# OpenRouter (recommended — enables free-model fallback when Google is saturated)
OPENROUTER_API_KEY=sk-or-v1-your-key

# Optional — paid BYOK providers for Expert Mode
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...

# BYOK encryption (required) — encrypts user-provided API keys at rest.
# Generate with: openssl rand -base64 32
BYOK_ENCRYPTION_KEY=your-base64-32-byte-key
```

> **BYOK encryption:** All user-provided provider keys (`profiles.byok_key`) are encrypted with AES-256-GCM before being stored, using `BYOK_ENCRYPTION_KEY` as the master key. Generate one with `openssl rand -base64 32` and keep it secret — losing it makes existing stored keys unrecoverable, and rotating it requires re-encrypting the column. If you have existing rows with plaintext keys from before this was introduced, run the one-time migration once `BYOK_ENCRYPTION_KEY` is set:
> ```bash
> node --env-file=.env.local scripts/migrate-byok-encryption.mjs
> ```
> This script additionally requires a temporary `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API in Supabase) to bypass RLS across all users. Remove it from your environment again once the migration finishes — it is never needed by the running app.

> **Note on OpenRouter free tier:** All free OpenRouter models share a single 50 requests/day per-account quota. For production scale, load $5 USD of credit on the OpenRouter account to unlock ~5000 free-model generations.

### 4. Run the Development Server
```bash
npm run dev
```

---

## 📚 Documentation

*   **`VELLURA_SPECS.md`** — Architectural specification (tech stack, schema, design system, AI cascade).
*   **`VELLURA_ROADMAP.md`** — Execution roadmap with phase status, including the Phase 7 AI cascade resilience work.
*   **`VELLURA_CODESTYLE.md`** — Code style and design signature ("AI Ethereal & Minimalist").
*   **`AUDIT_REPORT.md`** — Current state technical audit, including completed work, known debt, and prioritized work order.

---

*Designed and engineered as part of the Nattitor portfolio.*