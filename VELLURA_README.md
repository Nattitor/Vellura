# ✦ Vellura

> **The intelligent workspace for your career.**

Vellura is a Full-Stack Micro-SaaS application that generates hyper-personalized cover letters and pitches. Built with a focus on **Senior-level engineering standards**, it features real-time AI streaming, multi-provider routing, encrypted BYOK, robust state management, secure database architecture, and strict "Ethereal Minimalist" design principles.

> **Live demo:** [vellura.vercel.app](https://vellura.vercel.app) (Vercel free tier — no custom domain to keep hosting costs at $0 while still serving as a working portfolio piece)

---

## 🚀 Key Features

*   **Real-Time AI Streaming:** Vercel AI SDK streams responses chunk-by-chunk via `useCompletion`, with the actual model that responded surfaced in the UI via the `X-AI-Model` response header.
*   **Multi-Provider Cascade (Groq-first):** Speed mode tries `qwen/qwen3.8-27b` (Groq) first, then Google Gemini 3.7 Flash, then OpenRouter free models (Nemotron 3.5 Lightning, GLM 5.2, Laguna XS 2.1). Reasoning mode tries `openai/gpt-oss-120b` (Groq) first, then Gemma 4 31B, then Nemotron 3 Ultra 550B / Gemma 4 26B. A 429/403 short-circuits only that provider's remaining candidates (each free quota is independent) and emits a clear quota message.
*   **Encrypted BYOK:** User-provided API keys (Groq, OpenAI, Anthropic, DeepSeek, OpenRouter, Google) are encrypted at rest with **AES-256-GCM** (`utils/crypto.ts`). The server never returns the real key value to the client — only the list of `configuredProviders`.
*   **Atomic Quota Persistence:** Quota decrement and document insertion happen in a single Postgres transaction via the `consume_limit_and_save_document` RPC function (see `supabase/schema.sql`). Two simultaneous requests cannot over-consume the daily limit.
*   **Global User Context:** Users store their base resume/experience in a secure Supabase profile. This context is silently injected into the AI system prompt to eliminate repetitive data entry.
*   **5 free generations/day** with automatic UTC-midnight reset. (Original spec said 3; raised to give users more opportunities.)
*   **CV Parsing:** Drag-and-drop PDF, DOCX, TXT or MD. Multi-model AI cascade with local regex fallback if all providers fail.
*   **Persistent History:** All generated documents are saved with RLS-isolated access. Search, filter by provider, paginate, and export.
*   **Professional Export:** Rich Markdown rendering + one-click PDF export via `jspdf` (`lib/pdf.ts`).
*   **4-Language UI:** English, Spanish, French, Portuguese. Both `ui_language` and `output_language` are persisted in the profile.

---

## 🛠 Tech Stack

*   **Framework:** Next.js 16.3.1 (App Router, Turbopack, Server Components, Server Actions)
*   **UI runtime:** React 19, Base UI primitives via shadcn (not Radix)
*   **Language:** TypeScript 5, `strict: true`
*   **Styling:** Tailwind CSS v4
*   **Database & Auth:** Supabase (PostgreSQL + SSR Auth + RLS)
*   **AI Orchestration:** Vercel AI SDK 7 (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
*   **AI Providers:** Google Gemini (system), OpenRouter (free fallback), OpenAI / Anthropic / DeepSeek (BYOK)
*   **PDF:** `jspdf` (centralized in `lib/pdf.ts`)
*   **Markdown:** `react-markdown`
*   **i18n:** Custom context provider with 4-language dictionaries
*   **Toasts / Motion:** Sonner + Framer Motion

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

Create a `.env.local` file in the root directory. The full list of required and optional variables:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google AI (REQUIRED — primary provider for the free tier)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key

# OpenRouter (RECOMMENDED — enables free-model fallback when Google is saturated)
OPENROUTER_API_KEY=sk-or-v1-your-key

# BYOK Encryption (REQUIRED for the BYOK feature)
# Generate with: openssl rand -base64 32
BYOK_ENCRYPTION_KEY=<32-bytes-base64>

# Optional — paid BYOK providers for Expert Mode
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
```

> **DO NOT** add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. That key is only needed for the one-time migration script (`scripts/migrate-byok-encryption.mjs`) if you have existing plain-text BYOK keys in your database. After running that script, remove it.

### 4. Run the Development Server
```bash
npm run dev
```

### 5. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all the environment variables from step 3 in **Project Settings → Environment Variables**.
4. In your **Supabase Dashboard → Authentication → URL Configuration**, add the Vercel deployment URL to:
   - **Site URL**
   - **Redirect URLs** (e.g. `https://your-app.vercel.app/auth/callback`)
5. In your **Supabase Dashboard → SQL Editor**, paste and run the contents of `supabase/schema.sql` to create the tables, RLS policies, and the atomic quota RPC.
6. Push a commit or trigger a redeploy.

---

## 🔐 Security Notes

* **BYOK keys** are encrypted at rest with **AES-256-GCM** using a key derived from `BYOK_ENCRYPTION_KEY`. The encryption layer (`utils/crypto.ts`) uses a versioned envelope format (`v1:<iv>:<authTag>:<ciphertext>`) so future key rotation is possible without losing access to historical data.
* **Client payloads** never receive real BYOK key values — only a list of `configuredProviders` (e.g. `["openai", "google"]`).
* **Expert Mode** is restricted to the `AI_MODELS` catalog: paid providers (OpenAI, Anthropic, DeepSeek) never use system keys, only the user's own.
* **Quota persistence** is atomic via the `consume_limit_and_save_document` Postgres function, eliminating the race condition where two simultaneous requests could each decrement the quota but only one would actually save the document.

---

## 📚 Documentation

*   **`VELLURA_SPECS.md`** — Architectural specification (tech stack, schema, design system, AI cascade).
*   **`VELLURA_ROADMAP.md`** — Execution roadmap with current phase status and remaining work.
*   **`VELLURA_CODESTYLE.md`** — Code style and design signature ("AI Ethereal & Minimalist").
*   **`AUDITORIA_ACTUALIZADA.md`** — Latest critical audit (Sep 2026) covering security, privacy, cascade and persistence findings.
*   **`AUDIT_REPORT.md`** — Earlier high-level audit (kept as a historical summary).
*   **`supabase/schema.sql`** — Versioned database schema (tables, RLS policies, atomic quota RPC, profile-creation trigger).
*   **`_archive/`** — Old conversation logs (`status_flash.md`, `reporte_clave_maestra.md`) kept for reference.

---

*Designed and engineered as part of the Nattitor portfolio.*