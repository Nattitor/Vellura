# ✦ Vellura | Architecture & Specification (SPECS.md)

> **Document version:** Sep 3, 2026 (Groq-first cascade + updated_at migration).
> **For the current state of work, see `VELLURA_ROADMAP.md` and `AUDITORIA_ACTUALIZADA.md`.**

## 1. Project Overview

**Name:** Vellura
**Type:** Micro-SaaS (AI Cover Letter & Pitch Generator)
**Goal:** Demonstrate Senior-level Full-Stack capabilities — multi-provider AI routing, streaming, encrypted BYOK, atomic quota persistence, secure database architecture, multi-language UI, and strict "Ethereal Minimalist" design.
**Hosting:** Vercel (free tier, custom domain deferred until the user has budget for it).

## 2. Tech Stack (Verified)

| Layer | Implementation |
|-------|----------------|
| Framework | **Next.js 16.3.1** (App Router, Turbopack, Server Components & Server Actions) |
| UI runtime | React 19, **Base UI** primitives via shadcn (not Radix) |
| Language | TypeScript 5, `strict: true` |
| Styling | Tailwind CSS v4 |
| Components | shadcn generated on top of `@base-ui/react` |
| Database & Auth | Supabase (PostgreSQL + SSR Auth + RLS) |
| AI Orchestration | Vercel AI SDK 7 (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`) |
| AI Providers | Groq (system, primary free), Google Gemini (system), OpenRouter `:free` (last-resort free), OpenAI / Anthropic / DeepSeek (BYOK-only) |
| Streaming (client) | `useCompletion` from `@ai-sdk/react` |
| Streaming (server) | `streamText` + custom `ReadableStream` transform |
| PDF | `jspdf` (centralized in `lib/pdf.ts`) |
| Markdown | `react-markdown` |
| File parsing | `unpdf` (PDF), `mammoth` (DOCX) |
| i18n | Custom context provider (4 languages: EN, ES, FR, PT) |
| Toasts / Motion | Sonner + Framer Motion |
| BYOK encryption | `node:crypto` AES-256-GCM, versioned envelope format |

> **Intentionally documented deviations from the original spec:**
> - Daily limit is **5 generations/day** (was originally spec'd as 3; raised to give users more opportunities).
> - PDF is built with `jspdf` (was originally spec'd as `html2pdf.js`; replaced because `html2pdf.js` had rendering inconsistencies with the streaming markdown output).

## 3. Core Features (The "Product" Feel)

1. **Model Agnosticism:** Users select between **Speed** (default) and **Reasoning** via a dropdown. The backend routes through a multi-model cascade with automatic fallback. The actual model that responded is surfaced to the user via the `X-AI-Model` response header and displayed in the workspace + history.

2. **Global User Context:** A Settings/Profile page where the user pastes their base resume/experience. Stored encrypted in Supabase and silently injected into the AI system prompt to avoid repetitive typing.

3. **Real-Time Streaming & Premium UX:** Responses stream directly into the UI chunk-by-chunk. Premium loading states ("Analyzing professional context...", "Aligning skills...", "Drafting the masterpiece...") play during the first ~7 seconds of generation. The actual model name appears in a badge after the first chunk.

4. **SaaS Monetization Logic:** A "Daily Limit" system (**5 free generations per day**). Resets at UTC midnight. When the limit is reached, the Generate button is disabled and the UI shows a CTA pointing users to **Expert Mode + BYOK** in Settings. Power users can bypass limits entirely by connecting their own API keys.

5. **Robust Error Handling & Cascade Fallback:** Toast notifications for API timeouts, rate limits, and empty inputs. The `api/generate` route cascades Groq → Google → OpenRouter → Google last-resort. A 429/403 on one provider short-circuits only that provider's remaining candidates (each free quota is independent) with a clear user-facing message naming the exhausted quota.

6. **Data Persistence & Formatting:** All generated cover letters are saved to the user's history via the atomic `consume_limit_and_save_document` RPC. Output is parsed via `react-markdown` using a Serif font, with a premium overlaid "Copy to Clipboard" button (2-second checkmark micro-interaction).

7. **Privacy & Data Handling:** User CVs and job descriptions are only sent to AI providers the user is currently using. A privacy disclosure appears under the Generate button reminding the user that the data is transmitted to AI providers (with language-specific notice for free models that may use data for training).

8. **Strict Security:**
   - BYOK keys encrypted at rest with AES-256-GCM. The server never returns real key values to the client.
   - Expert Mode is restricted to the `AI_MODELS` catalog: paid providers (OpenAI, Anthropic, DeepSeek) never use system keys, only the user's own.
   - Atomic quota persistence prevents race conditions.
   - Session timeout/expired JWT handler redirects to `/login?expired=true`.

## 4. Database Schema (Supabase)

The versioned schema lives in **`supabase/schema.sql`**. It includes:

### Table: `profiles`
* `id` (uuid, references `auth.users`)
* `resume_text` (text, nullable)
* `daily_limit` (int, default 5)
* `last_generation_date` (date)
* `byok_key` (text, nullable — encrypted with `v1:` envelope format)
* `output_language` (text, default `'English'`)
* `ui_language` (text, default `'Spanish'`)
* `avatar_url` (text, nullable)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, default `NOW()` — backfilled on prod via `supabase/migration_updated_at.sql`, Sep 3 2026)

### Table: `documents`
* `id` (uuid, primary key)
* `user_id` (uuid, references `profiles.id`)
* `company_name` (text)
* `job_description` (text)
* `generated_content` (text)
* `ai_model_used` (text)
* `created_at` (timestamptz)

### RLS Policies
All tables have RLS enabled with `auth.uid() = id` and `auth.uid() = user_id` constraints for SELECT, INSERT, UPDATE, DELETE — full isolation per user.

### Trigger
`on_auth_user_created` automatically creates a `profiles` row when a user signs up via email or Google OAuth.

### Atomic RPC: `consume_limit_and_save_document`
A single Postgres function that, in one transaction:
1. Locks the profile row with `FOR UPDATE`
2. Checks if the user has quota remaining (or is in BYOK Expert Mode)
3. Resets quota to 5 if `last_generation_date` is not today (UTC)
4. Decrements `daily_limit` by 1
5. Inserts the row into `documents`
6. Returns the new document id

If the insertion fails for any reason, the quota is never decremented.

## 5. Design System & UI

* **Theme:** Dark mode strictly (no theme switcher). Colors: Zinc/Slate base (`#09090B`), Electric Violet (`#8B5CF6`) for primary CTAs, Neon Cyan (`#06B6D4`) for AI-active states.
* **Component Library:** shadcn/ui on Base UI primitives (Buttons, Inputs, Select, Textarea, Dialog, Sheet, Tabs, Skeleton, Sonner toasts).
* **Typography:** Geist Sans / Inter for UI, Geist Serif (or system serif fallback) for generated cover letters.
* **Auth UX (Split-Screen):** The `/login` page uses a modern split-screen layout. Left side: brand showcase. Right side: Supabase auth form inside an `.ethereal-panel`.
* **Settings Architecture:** Single-page tab layout (General/Profile, Security, Advanced). Language selectors for UI and AI output. BYOK input.
* **Premium UX Details:** Tone Selection is a predefined Select dropdown. Empty states have subtle SVGs. Loading states have rotating icon + 3-step loading messages.

## 6. AI Generation Cascade

> Order rationale (verified Sep 2026): Groq's free tier (no credit card, independent per-model quota) is the most reliable, so it goes first. Google direct is second (its 15 RPM free tier saturates). OpenRouter `:free` is last-resort — its 50 req/day quota is **per account, shared across all users and keys**, so 10 users exhaust it. IDs verified against `GET https://api.groq.com/openai/v1/models`; Groq retires versions periodically.

### Speed Mode
1. `qwen/qwen3.8-27b` (Groq direct — system key, user BYOK if configured)
2. `gemini-3.7-flash` (Google direct)
3. `nvidia/nemotron-3.5-lightning:free` (OpenRouter) → **429/403 short-circuits remaining OR**
4. `z-ai/glm-5.2:free` (OpenRouter)
5. `poolside/laguna-xs-2.1:free` (OpenRouter)
6. `gemini-3.6-flash` (Google direct, last resort)

### Reasoning Mode
1. `openai/gpt-oss-120b` (Groq direct — system key, user BYOK if configured)
2. `gemma-4-31b-it` (Google direct)
3. `nvidia/nemotron-3-ultra-550b-a55b:free` (OpenRouter) → **429/403 short-circuits remaining OR**
4. `google/gemma-4-26b-a4b-it:free` (OpenRouter)
5. `google/gemma-4-31b-it:free` (OpenRouter)
6. `gemini-3.6-flash` (Google direct, last resort)

### Expert Mode (BYOK)
- User selects a specific model and provider in the Model Selection Drawer.
- Only the selected model is invoked.
- The user's own API key (if configured for that provider) is used.
- Daily limit is bypassed entirely.
- If the user has no key for the selected provider and the model is paid, the UI blocks selection with a "BYOK Required" modal.

### CV Parsing Cascade (`app/api/parse-resume/route.ts`, Groq-first)
1. Local extraction (`unpdf` for PDF, `mammoth` for DOCX, native read for TXT/MD)
2. Groq: `qwen/qwen3.8-27b` (text path only — scanned PDFs without extractable text skip to step 3)
3. Google direct multimodal: `gemini-3.7-flash` → `gemma-4-31b-it` (supports native PDF upload; only path for image-only PDFs)
4. OpenRouter: `nvidia/nemotron-3-ultra-550b-a55b:free` → `nvidia/nemotron-3-super-120b-a12b:free` → `google/gemma-4-26b-a4b-it:free` → `thinkingmachines/inkling:free` → `z-ai/glm-5.2:free`
5. Local regex-based formatter (no AI) — last resort

## 7. Quota & Monetization

* **5 free generations per day**, per user, resets at UTC midnight.
* When the limit is reached, the Generate button is disabled and the UI shows a CTA: **"Bring your own API key for unlimited generations"** linking to `/dashboard/settings?tab=advanced`.
* BYOK users in Expert Mode bypass the daily limit entirely.
* The OpenRouter free tier shares a single 50 requests/day per-account quota across all free models. For production scale, load $5 USD of credit on the OpenRouter account to unlock ~5000 free-model generations.
* **No paid Pro tier is offered** (project is a portfolio piece, not a commercial product). The CTA always points to BYOK as the alternative.