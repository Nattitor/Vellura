# ✦ Nattitor | Vellura Execution Roadmap

This roadmap tracks the construction of the Vellura Micro-SaaS. Each phase lists tasks that have been completed and the work that remains.

> **Document version:** Sep 2, 2026 (rewritten after critical audit + hardening).
> **For technical findings and bug discoveries, see `AUDITORIA_ACTUALIZADA.md` and `AUDIT_REPORT.md`.**

---

## Phase 1: Project Setup & UI Foundation
- [x] Initialize Next.js 16.3.1 App Router project with TypeScript.
- [x] Install and configure `Tailwind CSS v4` and `shadcn/ui` (on Base UI primitives, not Radix).
- [x] Install core dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `framer-motion`, `lucide-react`.
- [x] Configure `tailwind.config.ts` with the "AI Ethereal" color palette (Deep Void, Amethyst Glow, Neon Cyan).
- [x] Set up global fonts (Geist Sans / Inter for body, JetBrains Mono for mono).
- [x] Create the `.ethereal-panel` utility class in `globals.css`.
- [x] Create the `<VelluraLogo />` SVG component (Geometric Fold design).

## Phase 2: Database & Authentication (Supabase)
- [x] Create `.env.local` with Supabase credentials.
- [x] Provide versioned SQL schema in `supabase/schema.sql` (tables, RLS policies, profile-creation trigger, atomic quota RPC).
- [x] Implement Supabase SSR Auth Middleware to protect `/dashboard` routes.
- [x] Build `/login` page with split-screen layout (Left: brand/tagline, Right: auth form).
- [x] Create robust auth utility / Server Actions for session management (login, signup, Google OAuth, password reset, account security).

## Phase 3: Global Context (User Profile)
- [x] Build the `/dashboard/layout.tsx` (Topbar navigation).
- [x] Build the `/dashboard/settings` page.
- [x] Implement a form for the user to input/edit their `resume_text` (Global Context).
- [x] Create Server Actions to update the user's profile in the Supabase database.
- [x] Persist both `ui_language` and `output_language` to the profile (cross-device, cross-session).

## Phase 4: The AI Generation Engine (Core)
- [x] Install AI dependencies: `ai` (Vercel AI SDK) and `@ai-sdk/google`.
- [x] Create the Next.js Route Handler (`app/api/generate/route.ts`).
- [x] Implement prompt engineering logic (merging user resume + job description + tone + output language + custom directives).
- [x] Build the `/dashboard` frontend UI with Input Textareas, Tone Select, Model Select Dropdown.
- [x] Connect the UI to the backend using the `useCompletion` hook for real-time text streaming.
- [x] Surface the actual model that responded via the `X-AI-Model` response header and display it in the UI.
- [x] Add premium 3-step loading states ("Analyzing...", "Aligning...", "Drafting...").

## Phase 5: Refined SaaS Mechanics & Engine Limits
- [x] Refactor `/dashboard/settings` to use a shadcn Tabs layout (General, Security, Advanced).
- [x] Add BYOK (Bring Your Own Key) and Language Selectors to Settings.
- [x] Migrate database schema to a `daily_limit` / `last_generation_date` system (5 free generations/day).
- [x] Update `api/generate` to enforce Daily Limit and check for BYOK.
- [x] Implement Dynamic Model Fallback in `api/generate` (switch models if primary fails or is rate-limited).
- [x] Atomic quota persistence via `consume_limit_and_save_document` RPC (eliminates race conditions).
- [x] **BYOK encryption at rest with AES-256-GCM** (`utils/crypto.ts`, `utils/byok.ts`). The server never returns real key values to the client.
- [x] Expert Mode restricted to catalog models + BYOK-only paid providers (no system-key fallback abuse).
- [x] Streaming timeout decoupled: 4.5s probe only checks connection, never aborts an established stream.
- [x] OpenRouter 429/403 short-circuit: when OR returns rate-limit, skip remaining OR models and emit clear quota message.
- [x] Implementation of session timeout / expired JWT handler.

## Phase 6: History & Final Polish
- [x] Build the `/dashboard/history` page to fetch and display past generated documents.
- [x] Implement `react-markdown` to render AI output using a Serif font.
- [x] Add premium "Copy to Clipboard" overlay with 2-second checkmark micro-interaction.
- [x] Add "Export to PDF" functionality via `jspdf` (centralized in `lib/pdf.ts`).
- [x] Mobile-responsive layout with proper padding and touch targets.
- [x] SEO metadata (with the limitation that og-image and preview assets are still pending).

## Phase 7: AI Model Cascade Resilience
- [x] Fix OpenRouter key string-truthy bug in `utils/ai-providers.ts`.
- [x] Unify Google BYOK priority across Speed / Reasoning / Expert modes.
- [x] Add pre-flight validation in `api/generate` to return 400 when no functional key is configured.
- [x] Verify all OpenRouter free model IDs against `/api/v1/models` and replace invalid ones.
- [x] Reorder Speed mode cascade Groq-first: `qwen/qwen3.8-27b` (Groq) → `gemini-3.7-flash` → Nemotron 3.5 Lightning → GLM 5.2 → Laguna XS 2.1 → `gemini-3.6-flash` (last resort).
- [x] Reorder Reasoning mode cascade Groq-first: `openai/gpt-oss-120b` (Groq) → `gemma-4-31b-it` → Nemotron 3 Ultra 550B → Gemma 4 26B → Gemma 4 31B free → `gemini-3.6-flash`.
- [x] 429/403 short-circuit per provider in cascade catch block: a rate-limit skips only that provider's remaining candidates (each free quota is independent).
- [x] Update all i18n labels (EN/ES/FR/PT) for the new default models.
- [x] `HistoryList.getModelInfo` correctly badges the new OR models.

## Phase 8: Security & Privacy Hardening
- [x] **BYOK encryption** at rest with AES-256-GCM (commit `03e1c05`).
- [x] **Client payload cleanup**: Settings page now receives only `configuredProviders: string[]`, never real key values.
- [x] **Expert Mode allowlist**: paid providers restricted to user BYOK only.
- [x] **Streaming timeout decoupled** from stream lifetime (commit `ede4396`).
- [x] **Model attribution fix**: when OpenRouter short-circuits, the cascade attribution is correct (commit `ede4396`).
- [x] **Real model surfaced** via `X-AI-Model` header, consumed by client (commit `6ec652a`).
- [x] **Privacy notices** added to the Workspace, Model Selection Drawer, and CV upload.
- [x] **Migration script** (`scripts/migrate-byok-encryption.mjs`) for existing plain-text BYOK keys.

## Phase 9: Database Reproducibility
- [x] **`supabase/schema.sql`** with all tables, constraints, indexes, RLS policies, profile-creation trigger, and the `consume_limit_and_save_document` RPC.
- [x] Atomic quota + document persistence in a single transaction.

---

## Remaining Work (Post-Deploy)

### Phase 10: Quality, Stability, Privacy (in progress)
- [ ] Resolve the 31 lint errors (`any` types in AI routes, `setState` in `useEffect` in providers, unused imports, React Compiler memoization failures).
- [ ] Add Zod validation to all Server Actions and API routes.
- [ ] Add a `<html lang>` attribute that reflects the actual UI language (currently hardcoded to `es`).
- [ ] Add rate limiting per user/IP for `/api/generate` and `/api/parse-resume`.
- [ ] Add error boundaries and `loading.tsx` files in dashboard routes.
- [ ] Cleanup of unused UI components (`accordion`, `dropdown-menu`, `skeleton`, `tabs` — listed but not currently consumed).
- [ ] Generate real `og-image.png` and `preview.webp` assets.
- [ ] Set canonical domain (currently `vercel.app`; custom `vellura.ai` deferred).
- [ ] Accessibility pass: focus trap in Onboarding/Drawer/Dialog, keyboard navigation for model cards, `prefers-reduced-motion` respect.
- [x] Mobile F0+F1: viewport/safe-area/touch-target base, bottom tab bar, slim topbar with compact quota pill (commits `3ff70ed`, `9cb4752`).
- [x] Mobile F2: Generate workspace phone layout — sticky button, 2-row output header, tap tooltip, 16px fields (commit `30285d3`).
- [ ] Mobile QA resto: Drawer + Onboarding (F3), Historial + Ajustes + Login (F4).
- [ ] Clipboard API rejection handling.

### Phase 11: Testing
- [ ] Unit tests for `utils/limits.ts`, `utils/extract-company.ts`, `utils/ai-providers.ts`, `utils/crypto.ts`, `utils/byok.ts`, `lib/pdf.ts` (>80% coverage).
- [ ] Integration tests for Server Actions and API routes (auth, quota, BYOK encryption, cascade).
- [ ] E2E tests with Playwright: Auth flow, Generate flow, History flow, BYOK flow.
- [ ] CI pipeline (GitHub Actions: lint, typecheck, test, build).

### Phase 12: Production Hardening (only if scaling beyond portfolio)
- [ ] Service layer extraction (`lib/services/`).
- [ ] Rate limiting via Upstash/Redis.
- [ ] Error tracking (Sentry or similar).
- [ ] Loading boundaries in `app/loading.tsx`.
- [ ] Real production observability (Vercel Analytics + custom logs).

---

## Cascade Architecture (Current — Groq-first, Sep 3 2026)

### Speed Mode
```
1. qwen/qwen3.8-27b (Groq direct, BYOK if configured)
2. gemini-3.7-flash (Google direct)
3. nemotron-3.5-lightning (OpenRouter)  ← 429/403 → skip rest of OR
4. glm-5.2 (OpenRouter)
5. laguna-xs-2.1 (OpenRouter)
6. gemini-3.6-flash (Google direct, last resort)
```

### Reasoning Mode
```
1. openai/gpt-oss-120b (Groq direct, BYOK if configured)
2. gemma-4-31b-it (Google direct, BYOK if configured)
3. nemotron-3-ultra (OpenRouter)         ← 429/403 → skip rest of OR
4. gemma-4-26b (OpenRouter)
5. gemma-4-31b-it (OpenRouter free)
6. gemini-3.6-flash (Google direct, last resort)
```

### Verified OpenRouter Free Models (active in cascade)
- Speed: Nemotron 3.5 Lightning, GLM 5.2, Laguna XS 2.1
- Reasoning: Nemotron 3 Ultra 550B, Gemma 4 26B, Gemma 4 31B
- Auxiliary (in catalog, not in default cascade): Laguna S 2.1, Ling 3.0 Flash Fin, Inkling, Auto-Router

> **Quotas:** Groq (no credit card, per-model quota) goes first; Google direct second (15 RPM free tier). All OpenRouter free models share a single 50 requests/day per-account quota — shared across ALL users and keys, so ~10 users exhaust it. For production scale, the OpenRouter account needs credit balance (~$5 USD = ~5000 free-model generations). For portfolio use, the daily limit of 5 generations × 1 demo user is well within quota.