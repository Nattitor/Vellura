# ✦ Vellura | Architecture & Specification (SPECS.md)

> **Status note (Sep 1, 2026):** This document is the architectural spec. Two known intentional divergences from the original are noted below (5/day limit instead of 3; `jspdf` instead of `html2pdf.js`). Both are documented product decisions, not bugs. For the current state of code vs. docs, see `AUDIT_REPORT.md`.

## 1. Project Overview
**Name:** Vellura
**Type:** Micro-SaaS (AI Cover Letter & Pitch Generator)
**Goal:** Demonstrate Senior-level Full-Stack capabilities, API integrations, streaming states, database architecture, and SaaS product sense.

## 2. Tech Stack
* **Framework:** Next.js 15.3 (App Router, Server Components & Server Actions, Turbopack)
* **Styling:** Tailwind CSS v4 + **shadcn/ui** (Radix UI primitives for accessible, premium components)
* **Database & Auth:** Supabase (PostgreSQL, SSR Auth via middleware, RLS)
* **AI Orchestration:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
* **AI Models (Agnosticism):**
  - **Primary (system key):** Google Gemini 3.7 Flash (Speed), Gemma 4 31B (Reasoning)
  - **Free OpenRouter fallback:** Nemotron 3.5 Lightning, GLM 5.2, Laguna XS 2.1, Laguna S 2.1, Ling 3.0 Flash Fin, Inkling
  - **Reasoning OpenRouter:** Nemotron 3 Ultra 550B, Nemotron 3 Super 120B, Gemma 4 26B, Gemma 4 31B
  - **Paid / BYOK:** OpenAI (GPT-5.6 family), Anthropic Claude 5 (Sonnet, Opus, Fable), DeepSeek V4 (Pro, Flash, V3.2)
* **Markdown Rendering:** `react-markdown` with `remark-gfm`
* **PDF Export:** `jspdf` (client-side, deterministic text layout). **Note:** original spec mentioned `html2pdf.js`; replaced because html2pdf.js had rendering inconsistencies with the streaming markdown output.

## 3. Core Features (The "Product" Feel)
1. **Model Agnosticism:** Users can select between "Speed" (Gemini 3.7 Flash) or "Reasoning" (Gemma 4 31B) via a dropdown. The backend routes the request through a multi-model cascade, with automatic fallback if the primary model fails or is rate-limited.
2. **Global User Context:** A Settings/Profile page where the user pastes their base Resume/Experience. This is stored in Supabase and silently injected into the AI system prompt to avoid repetitive typing.
3. **Real-time Streaming & Premium UX:** AI responses stream directly into the UI chunk-by-chunk using `useCompletion`. The UI must include premium loading states (e.g., "Analyzing professional context...").
4. **SaaS Monetization Logic:** A "Daily Limit" system (**5 free generations per day** — intentionally raised from original spec of 3 to give users more opportunities). When the limit is reached, the generate button is disabled and triggers a "Pro Upgrade" modal (UI stub). Power users can bypass limits via "Bring Your Own Key" (BYOK) option in Expert Mode.
5. **Robust Error Handling & Fallback:** Toast notifications for API timeouts, rate limits, or empty inputs. The `api/generate` route gracefully cascades through 4-5 alternative models if the primary fails. OpenRouter rate-limit responses (429) trigger a smart short-circuit to skip remaining OR models and fall back to Google direct.
6. **Data Persistence & Formatting:** All generated cover letters are saved to the user's History. The output MUST not be raw Markdown; it must be parsed via `react-markdown` using a Serif font, and include a premium overlaid "Copy to Clipboard" button with a 2-second checkmark micro-interaction.
7. **Strict Security:** Session Timeout/Expiration handler. If the Supabase JWT expires, the middleware gracefully redirects the user to `/login?expired=true`.

## 4. Database Schema (Supabase)
We need two primary tables (RLS enabled, restricted to authenticated users):

**Table: `profiles`**
* `id` (uuid, references `auth.users`)
* `resume_text` (text, nullable)
* `daily_limit` (int, default 5) — **note: was 3 in original spec**
* `last_generation_date` (date)
* `byok_key` (text, nullable — **stored as plain JSON of provider→key pairs**; encryption is a future security sprint item, see `AUDIT_REPORT.md` Section F)
* `output_language` (text, default "English")
* `ui_language` (text, default "Spanish")
* `avatar_url` (text, nullable)
* `created_at` (timestamp)

**Table: `documents`**
* `id` (uuid, primary key)
* `user_id` (uuid, references `profiles.id`)
* `company_name` (text)
* `job_description` (text)
* `generated_content` (text)
* `ai_model_used` (text)
* `created_at` (timestamp)

> The SQL schema file (`supabase/schema.sql`) is not yet in the repo. The schema is currently inferred from code — see `AUDIT_REPORT.md` Section J Phase 8 for the pending task.

## 5. Design System & UI
* **Theme:** Dark mode strictly (NO theme switcher). Colors: Zinc/Slate base (`#09090B`), with an accent color of Electric Violet (`#8B5CF6`) or Neon Cyan (`#06B6D4`) for AI elements.
* **Component Library:** `shadcn/ui` (Buttons, Inputs, Select, Textarea, Skeleton, Toast, Dialog/Modal, Tabs).
* **Typography:** Inter (Sans) for UI, readable Serif for the generated Cover Letters to give them a "document" feel.
* **Auth UX (Split-Screen):** The `/login` page must use a modern Split-Screen layout. The left side showcases the brand, logo, and tagline: *"The intelligent workspace for your career."* The right side contains the functional Supabase auth form inside an `.ethereal-panel`.
* **Settings Architecture:** The `/dashboard/settings` route utilizes a single-page Tab layout (Tabs: Profile/General, Security, Advanced). Includes language selectors for UI and AI Output, and BYOK input.
* **UX Details:** Tone Selection must use a predefined Select dropdown (e.g., "Professional & Polished"). Empty states with subtle SVGs/Icons if no history exists, loading skeletons, and button loading states.

## 6. AI Generation Cascade (Updated Sep 1, 2026)

### Speed Mode Cascade
1. `gemini-3.7-flash` (Google direct — no extra key required)
2. `nvidia/nemotron-3.5-lightning:free` (OpenRouter — if quota available)
3. `z-ai/glm-5.2:free` (OpenRouter)
4. `poolside/laguna-xs-2.1:free` (OpenRouter)
5. `gemini-3.6-flash` (Google direct, last resort)

If OpenRouter returns 429 (rate limit) or 403 (model restricted), the cascade short-circuits past remaining OR models and emits a clear user-facing message: *"Tu cuota gratuita de OpenRouter (50 requests/día) se agotó."*

### Reasoning Mode Cascade
1. `gemma-4-31b-it` (Google direct)
2. `nvidia/nemotron-3-ultra-550b-a55b:free` (OpenRouter)
3. `google/gemma-4-26b-a4b-it:free` (OpenRouter)
4. `google/gemma-4-31b-it:free` (OpenRouter)
5. `gemini-3.6-flash` (Google direct, last resort)

### Expert Mode (BYOK)
- Users select a specific model and provider in the Model Selection Drawer
- Only the selected model is invoked
- The user's own API key (if configured for that provider) is used; otherwise the system key
- Daily limit is bypassed entirely

### CV Parsing Cascade
1. Google direct multimodal (Gemini 3.7 Flash, Gemma 4 31B) — supports direct PDF upload
2. OpenRouter reasoning models (Nemotron 3 Ultra/Super, Gemma 4 26B)
3. OpenRouter speed models (Inkling, GLM 5.2)
4. Local regex-based formatter (no AI) — last resort

## 7. Quota & Monetization Notes

* Daily limit: **5 generations/day** (per user, per UTC day). Originally documented as 3; raised to give users more opportunities.
* When limit is reached, the Generate button is disabled and a toast suggests adding a BYOK key.
* BYOK users (in Expert Mode) bypass the daily limit entirely.
* The OpenRouter free tier is shared across all free models (50 requests/day per account). For production scale, the OpenRouter account needs credit balance (~$5 USD = ~5000 free-model generations).