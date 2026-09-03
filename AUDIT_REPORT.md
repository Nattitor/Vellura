# Vellura Project - Audit Report (Executive Summary)

**Date:** Sep 2, 2026
**Auditor:** Hermes Agent
**Status:** Production-ready as a portfolio piece, with documented remaining debt for commercial scale.

> **This is the high-level audit summary.** For a rigorous line-by-line review of the security, privacy, and cascade findings, see **[`AUDITORIA_ACTUALIZADA.md`](./AUDITORIA_ACTUALIZADA.md)**, which superseded the earlier findings of this report.

---

## A. Executive Summary

Vellura is a **production-ready AI cover letter generator for portfolio use**. The core flows — authentication, profile, generation with streaming, BYOK, history, PDF export, CV parsing, multi-language — are all functional. A subsequent critical audit (`AUDITORIA_ACTUALIZADA.md`) uncovered 8 high-severity issues which have all been addressed in the commit history.

**What works end-to-end:** Login → Profile setup → Master resume upload → CV parsing → AI generation with streaming → Save to history → Copy or export PDF.

**What remains for production-hardening beyond portfolio use:** 31 lint warnings, 0% test coverage, no rate limiting, no error boundaries, missing OG image assets, no CI pipeline, and accessibility work.

---

## B. Architecture (Current)

### Tech Stack (verified against `package.json`)

| Layer | Implementation |
|-------|----------------|
| Framework | **Next.js 16.3.1** (App Router, Turbopack) |
| UI runtime | React 19, **Base UI** primitives via shadcn (not Radix as originally documented) |
| Language | TypeScript 5, `strict: true` |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL + SSR Auth + RLS) |
| AI Orchestration | Vercel AI SDK 7 |
| AI Providers | Google Gemini (system), OpenRouter (free fallback), OpenAI / Anthropic / DeepSeek (BYOK) |
| Streaming | `useCompletion` from `@ai-sdk/react` |
| PDF | `jspdf` (centralized in `lib/pdf.ts`) |
| File Parsing | `mammoth` (DOCX), `unpdf` (PDF) |
| i18n | Custom context provider (4 languages) |
| BYOK encryption | `node:crypto` AES-256-GCM (`utils/crypto.ts`) |

### Project Structure
```
├── app/
│   ├── actions/          # Server Actions (auth, profile, documents)
│   ├── api/
│   │   ├── generate/     # AI streaming endpoint
│   │   └── parse-resume/ # CV parsing with AI cascade
│   ├── auth/callback/    # OAuth callback handler
│   ├── dashboard/        # Generate, History, Settings routes
│   ├── login/            # Split-screen auth
│   ├── globals.css       # Ethereal design tokens
│   └── layout.tsx        # Root layout + providers
├── components/
│   ├── dashboard/        # 12 dashboard components
│   ├── providers/        # 3 context providers (Language, Avatar, Quota)
│   ├── ui/               # shadcn/ui components (some unused, see debt)
│   └── auth/             # AuthForm
├── lib/
│   ├── pdf.ts            # Centralized jsPDF export
│   └── utils.ts          # cn() helper
├── utils/
│   ├── ai-models.ts      # Model catalog (Google, OpenRouter, OpenAI, Anthropic, DeepSeek)
│   ├── ai-providers.ts   # Provider resolution logic
│   ├── byok.ts           # BYOK encrypted parser/serializer
│   ├── crypto.ts         # AES-256-GCM helpers
│   ├── supabase/         # Client/Server/Middleware clients
│   ├── i18n/             # 4-language dictionaries
│   ├── limits.ts         # Daily limit computation
│   ├── extract-company.ts # Company/role extraction
│   └── model-display.ts  # Model name → display label
├── supabase/
│   └── schema.sql        # Versioned schema (tables, RLS, atomic quota RPC)
├── scripts/
│   └── migrate-byok-encryption.mjs  # One-time encryption migration
└── _archive/             # Old conversation logs (status_flash, reporte_clave_maestra)
```

### Data Flow (current)
```
User → /login → Supabase Auth → /dashboard (RSC)
  → LanguageProvider + AvatarProvider + QuotaProvider
  → GenerateWorkspace → useCompletion → POST /api/generate
    → Pre-flight: validate at least one key
    → Cascade (Speed or Reasoning or Expert)
    → streamText → ReadableStream tee → live stream + probe
    → onFinish → consume_limit_and_save_document RPC (atomic)
    → X-AI-Model header → client surfaces actual model used
```

---

## C. Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (email + Google OAuth) | ✅ Complete | |
| Profile + master resume + CV upload | ✅ Complete | Drag-and-drop, multimodal PDF parsing |
| AI generation with streaming | ✅ Complete | Real model surfaced to UI |
| Speed / Reasoning / Expert modes | ✅ Complete | Expert mode restricted to catalog + BYOK |
| 5 free generations/day | ✅ Complete | Atomic persistence via RPC, UTC midnight reset |
| BYOK (multi-provider) | ✅ Complete + encrypted | AES-256-GCM, no key values sent to client |
| History (search, filter, paginate) | ✅ Complete | |
| PDF export | ✅ Complete | Centralized in `lib/pdf.ts` |
| Copy to clipboard | ✅ Complete | |
| 4-language UI | ✅ Complete | ui_language and output_language both persisted |
| Privacy notices | ✅ Complete | On workspace, drawer, CV upload |
| OpenRouter free fallback | ✅ Complete | 429/403 short-circuits to Google direct |
| Login OTP / password reset | ✅ Complete | |
| Rate limiting | ❌ Missing | Per-user/IP — for production scale |
| OG image / SEO assets | ❌ Missing | `preview.webp` and `og-image.png` are referenced but absent |
| Error boundaries | ❌ Missing | |
| Tests (unit, integration, E2E) | ❌ Missing | 0% coverage |
| CI pipeline | ❌ Missing | |
| Accessibility (focus trap, reduced motion, keyboard nav) | ❌ Incomplete | |

---

## D. Security Posture (post-Phase 8 hardening)

| Item | Status |
|------|--------|
| BYOK keys encrypted at rest (AES-256-GCM, versioned envelope) | ✅ Done (`utils/crypto.ts`) |
| BYOK keys never sent to client | ✅ Done (Settings receives only `configuredProviders[]`) |
| Expert Mode restricted to catalog + BYOK | ✅ Done (no system-key fallback abuse) |
| Quota persistence atomic (race condition fix) | ✅ Done (Postgres RPC) |
| RLS policies versioned in `supabase/schema.sql` | ✅ Done |
| Streaming timeout decoupled from stream lifetime | ✅ Done (4.5s is probe only) |
| Cascade attribution correct (no false OpenRouter errors) | ✅ Done |
| Actual model surfaced via `X-AI-Model` header | ✅ Done |
| Privacy notices for free model data handling | ✅ Done |
| Rate limiting | ❌ Pending |
| Error tracking / observability | ❌ Pending |

---

## E. Roadmap Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Setup & UI Foundation | ✅ Complete |
| 2 | Database & Authentication | ✅ Complete |
| 3 | Global Context (Profile) | ✅ Complete |
| 4 | AI Generation Engine (Core) | ✅ Complete |
| 5 | SaaS Mechanics & Engine Limits | ✅ Complete |
| 6 | History & Final Polish | ✅ Complete |
| 7 | AI Model Cascade Resilience | ✅ Complete |
| 8 | Security & Privacy Hardening | ✅ Complete |
| 9 | Database Reproducibility | ✅ Complete |
| 10 | Quality, Stability, Privacy polish | ⏳ In progress |
| 11 | Testing (unit, integration, E2E) | ❌ Pending |
| 12 | Production hardening (only if scaling) | ❌ Pending |

Full status: see `VELLURA_ROADMAP.md`.

---

## F. Technical Debt (remaining)

### Code Quality
- 31 lint warnings remain (preexisting from the original code):
  - `any` types in AI routes (5 in `api/generate`, 3 in `api/parse-resume`, 1 in `profile.ts`)
  - `setState` synchronously in `useEffect` in 3 providers and `sheet.tsx`
  - React Compiler memoization failures in `GenerateWorkspace.tsx`
  - Unused imports in `HistoryList.tsx` and `ModelSelectionDrawer.tsx`
- Several UI components are installed but unused: `accordion`, `dropdown-menu`, `skeleton`, `tabs`.
- `hooks/` and `scratch/` directories are empty.
- `html2pdf.js` was removed in the recent hardening.

### Component Sizing
- `GenerateWorkspace.tsx` ~811 lines (god component)
- `HistoryList.tsx` ~746 lines
- `OnboardingWizard.tsx` ~705 lines
- `ModelSelectionDrawer.tsx` ~568 lines
- `api/generate/route.ts` ~377 lines
- `api/parse-resume/route.ts` ~438 lines

Refactoring these is desirable but not blocking for portfolio use.

### Documentation Drift (resolved in this update)
- Earlier docs claimed Next.js 15.3 + Radix — actual is Next.js 16.3.1 + Base UI.
- Earlier docs claimed `remark-gfm` — actual is plain `react-markdown`.
- Earlier docs claimed html2pdf.js — actual is `jspdf` (intentional).
- Earlier docs didn't reflect BYOK encryption, atomic quota RPC, or the verified OpenRouter catalog.

These have been corrected in `VELLURA_SPECS.md`, `VELLURA_ROADMAP.md`, and `VELLURA_README.md` as of Sep 2, 2026.

---

## G. Deployment (Vercel)

| Step | Who | Status |
|------|-----|--------|
| Push repo to GitHub | User | Pending |
| Import in Vercel | User | Pending |
| Add env vars in Vercel (Supabase, Google AI, OpenRouter, BYOK_ENCRYPTION_KEY) | User | Pending |
| Configure Site URL + Redirect URLs in Supabase Auth | User | Pending |
| Run `supabase/schema.sql` in Supabase SQL Editor | User | ✅ Done |
| Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` | User | ✅ Done |
| Verify build + smoke-test generate in production | User | Pending |

---

## H. Sensitive Areas (don't touch in isolation)

| Area | Why sensitive |
|------|---------------|
| `app/api/generate/route.ts` | Core product, quota, costs, streaming, persistence |
| `app/api/parse-resume/route.ts` | PII handling, multiple external providers |
| `utils/ai-providers.ts` | Key resolution, paid provider access |
| `utils/ai-models.ts` | External IDs, catalog, defaults |
| `utils/crypto.ts` + `utils/byok.ts` | Encryption layer — any change must be backward-compatible |
| `app/actions/profile.ts` | BYOK writes, profile, avatar |
| `supabase/schema.sql` | RLS, atomic quota, profile creation trigger |
| `utils/supabase/middleware.ts` | Auth gateway, cookie handling |
| `QuotaProvider` + `utils/limits.ts` | Monetization, client-server sync |
| Language providers | State nesting, persistence across DB/cookie/localStorage |

---

## I. Recommended Next Steps

1. **Deploy to Vercel** (you can do this now — the build is green and the schema is deployed).
2. **Add tests** (Phase 11) — particularly:
   - `utils/crypto.ts` (encryption envelope roundtrip)
   - `utils/limits.ts` (quota math)
   - `utils/extract-company.ts` (regex patterns)
   - Server Actions (auth, profile)
   - Cascade logic in `api/generate` (mock providers)
3. **Polish the lint debt** (Phase 10) — improve without disabling rules.
4. **Add error boundaries** (cheap, high-value).
5. **Add OG image + preview asset** (cheap, high-value for social previews).
6. **Add `<html lang>` dynamic attribute** (cheap, accessibility win).

Each of these is a self-contained, low-risk change that increases portfolio value. None of them block deployment.

---

## J. References

- **[`AUDITORIA_ACTUALIZADA.md`](./AUDITORIA_ACTUALIZADA.md)** — Rigorous line-by-line audit that superseded the original findings. All 8 critical findings have been addressed.
- **[`VELLURA_SPECS.md`](./VELLURA_SPECS.md)** — Current architectural specification.
- **[`VELLURA_ROADMAP.md`](./VELLURA_ROADMAP.md)** — Phase-by-phase status.
- **[`VELLURA_README.md`](./VELLURA_README.md)** — Public-facing project description.
- **[`VELLURA_CODESTYLE.md`](./VELLURA_CODESTYLE.md)** — Design signature and code style.
- **[`supabase/schema.sql`](./supabase/schema.sql)** — Versioned database schema.
- **[`_archive/`](./_archive/)** — Historical conversation logs from the project build.

---

**End of Audit Report**