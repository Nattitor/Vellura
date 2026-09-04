# ✦ Vellura

> **The intelligent workspace for your career.**

Vellura is a full-stack Micro-SaaS that generates hyper-personalized cover letters and pitches. Built to senior-level engineering standards, it features real-time AI streaming, multi-provider routing, encrypted BYOK, atomic quota persistence, secure database architecture, and strict "Ethereal Minimalist" design principles.

> **Live demo:** [vellura.vercel.app](https://vellura.vercel.app) (Vercel free tier — no custom domain, hosting cost $0, working portfolio piece)

---

## 🚀 Key Features

*   **Real-Time AI Streaming:** Vercel AI SDK streams responses chunk-by-chunk, with the actual model that responded surfaced in the UI via the `X-AI-Model` response header.
*   **Multi-Provider Cascade (Groq-first):** Speed mode tries `qwen/qwen3.8-27b` (Groq) first, then Google Gemini 3.7 Flash, then OpenRouter free models. Reasoning mode tries `openai/gpt-oss-120b` (Groq) first, then Gemma, then OpenRouter free models. A 429/403 short-circuits only that provider's remaining candidates and emits a clear quota message.
*   **Encrypted BYOK:** User-provided API keys (Groq, OpenAI, Anthropic, DeepSeek, OpenRouter, Google) are encrypted at rest with **AES-256-GCM** (`utils/crypto.ts`). The server never returns real key values to the client — only the list of configured providers.
*   **Atomic Quota Persistence:** Quota decrement and document insertion happen in a single Postgres transaction via the `consume_limit_and_save_document` RPC (`supabase/schema.sql`). Simultaneous requests cannot over-consume the daily limit.
*   **Global User Context:** Users store their base resume in a secure Supabase profile. It is silently injected into AI prompts — no repetitive data entry.
*   **5 free generations/day** with automatic UTC-midnight reset.
*   **CV Parsing:** Drag-and-drop PDF, DOCX, TXT or MD. Multi-model AI cascade with local fallback if all providers fail.
*   **Persistent History:** Every document saved with RLS-isolated access. Search, filter by provider, paginate, export.
*   **Professional Export:** Markdown rendering + one-click PDF export (`lib/pdf.ts`).
*   **4-Language UI:** English, Spanish, French, Portuguese — UI language auto-detected from the browser, output language configurable per user.
*   **Mobile-ready:** Responsive phone layouts with bottom navigation, safe-area support and 44px touch targets.

---

## 🛠 Tech Stack

*   **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
*   **UI runtime:** React 19, Base UI primitives via shadcn
*   **Language:** TypeScript 5, `strict: true`
*   **Styling:** Tailwind CSS v4
*   **Database & Auth:** Supabase (PostgreSQL + SSR Auth + RLS)
*   **AI Orchestration:** Vercel AI SDK 7
*   **AI Providers:** Groq (primary), Google Gemini (fallback), OpenRouter free tier (last resort), OpenAI / Anthropic / DeepSeek (BYOK only)
*   **PDF:** `jspdf` · **Markdown:** `react-markdown` · **Toasts / Motion:** Sonner + Framer Motion

---

## 💻 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nattitor/vellura.git
cd vellura
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Groq (REQUIRED — primary provider)
GROQ_API_KEY=gsk-...

# Google AI (REQUIRED — first fallback)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key

# OpenRouter (OPTIONAL — last-resort free fallback)
OPENROUTER_API_KEY=sk-or-...

# BYOK Encryption (REQUIRED for the BYOK feature)
# Generate with: openssl rand -base64 32
BYOK_ENCRYPTION_KEY=<32-bytes-base64>

# Site URL (REQUIRED in production for metadata + auth redirects)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Optional — paid BYOK providers for Expert Mode
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
```

> **DO NOT** add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. It is only needed for one-off scripts and must never ship with the app.

### 4. Set up the database

In **Supabase Dashboard → SQL Editor**, run `supabase/schema.sql` (tables, RLS policies, atomic quota RPC, profile-creation trigger), then `supabase/migration_updated_at.sql`.

### 5. Run the development server

```bash
npm run dev
```

### 6. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all environment variables from step 3 in **Project Settings → Environment Variables**.
4. In **Supabase Dashboard → Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `https://your-app.vercel.app/**` to **Redirect URLs**.
5. Redeploy.

> **Confirmation emails:** Supabase's default email sender works out of the box within free-tier limits. A custom SMTP server (e.g. Brevo's free tier) is only needed to edit the email templates.

---

## 🔐 Security Notes

*   **BYOK keys** are encrypted at rest with **AES-256-GCM** using a key derived from `BYOK_ENCRYPTION_KEY`, in a versioned envelope (`v1:<iv>:<authTag>:<ciphertext>`) so future rotation is possible.
*   **Client payloads** never receive real BYOK key values — only the list of configured providers.
*   **Expert Mode** is restricted to the `AI_MODELS` catalog: paid providers never use system keys, only the user's own.
*   **Quota persistence** is atomic via Postgres RPC — no over-consume race conditions.

---

*Designed and engineered as part of the Nattitor portfolio.*
