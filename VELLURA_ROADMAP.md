# ✦ Nattitor | Vellura Execution Roadmap

This roadmap breaks down the construction of the Vellura Micro-SaaS into actionable, sequential phases. The AI Agent must mark checkboxes `[x]` as tasks are completed and commit the changes.

> **Status note (Sep 1, 2026):** All 6 original phases are implemented. The team is now in a stabilization + cascade-resilience phase. See `AUDIT_REPORT.md` for the current technical debt inventory.

---

## Phase 1: Project Setup & UI Foundation
- [x] Initialize Next.js 15 App Router project with TypeScript.
- [x] Install and configure `Tailwind CSS` and `shadcn/ui` (Radix primitives).
- [x] Install core dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `framer-motion`, `lucide-react`.
- [x] Configure `tailwind.config.ts` with the "AI Ethereal" color palette (Deep Void, Amethyst Glow, Neon Cyan).
- [x] Set up global fonts (*Geist Sans* / *Inter* for body, *JetBrains Mono* for mono).
- [x] Create the `.ethereal-panel` utility class in `globals.css`.
- [x] Create the `<VelluraLogo />` SVG component (Geometric Fold design).

## Phase 2: Database & Authentication (Supabase)
- [x] Create `.env.local` with Supabase credentials.
- [x] Provide SQL schema to the user to create the `profiles` and `documents` tables (with RLS policies).
- [x] Implement Supabase SSR Auth Middleware to protect `/dashboard` routes.
- [x] Build `/login` and `/register` pages using a Split-Screen layout (Left: Brand/Tagline, Right: Auth form).
- [x] Create a robust Auth utility hook/server action for session management.

## Phase 3: Global Context (User Profile)
- [x] Build the `/dashboard/layout.tsx` (Sidebar or Topbar navigation).
- [x] Build the `/dashboard/settings` page.
- [x] Implement a form for the user to input/edit their `resume_text` (Global Context).
- [x] Create Server Actions to update the user's profile in the Supabase database.
- [x] Add a Skeleton loading state while fetching the profile.

## Phase 4: The AI Generation Engine (Core)
- [x] Install AI dependencies: `ai` (Vercel AI SDK) and `@ai-sdk/google`.
- [x] Create the Next.js Route Handler (`app/api/generate/route.ts`).
- [x] Implement the prompt engineering logic (merging user resume + job description + tone).
- [x] Build the `/dashboard/generate` frontend UI (Input Textareas, Tone Select, Model Select Dropdown).
- [x] Connect the UI to the backend using the `useCompletion` hook for real-time text streaming.
- [x] Implement the "Thinking State" animated shimmer border on the Generate button.

## Phase 5: Refined SaaS Mechanics & Engine Limits
- [x] Refactor `/dashboard/settings` to use a shadcn Tabs layout (Profile, AI & Usage, Preferences).
- [x] Add BYOK (Bring Your Own Key) and Language Selectors (UI/Output) to the Settings preferences.
- [x] Migrate database schema from `credits` to a `daily_limit` and `last_generation_date` system (**5 free generations/day** — intentionally raised from original spec of 3 to give users more opportunities).
- [x] Update `api/generate` to enforce the new Daily Limit logic and check for BYOK.
- [x] Implement Dynamic Model Fallback in `api/generate` (switch models if primary fails/rate-limits).
- [x] Enhance Generate UI: Add Premium Loading States (e.g., "Analyzing professional context...") and predefined Tone Select dropdown.
- [x] Implement Session Timeout/Expiration in middleware (graceful redirect to `/login`).

## Phase 6: History & Final Polish
- [x] Build the `/dashboard/history` page to fetch and display past generated documents.
- [x] Implement `react-markdown` to render the AI output beautifully using a Serif font.
- [x] Add Premium "Copy to Clipboard" overlay on output with 2-second checkmark success micro-interaction.
- [x] Add "Export to PDF" functionality (**using `jspdf`** — html2pdf.js was replaced because it had rendering inconsistencies with the streaming markdown output).
- [x] Final Mobile-First QA (ensure responsive padding, no fake hovers, mobile menus work).
- [x] Update SEO Metadata for the production deployment.

---

## Phase 7: AI Model Cascade Resilience (Added Sep 1, 2026)
- [x] Fix OpenRouter key string-truthy bug in `utils/ai-providers.ts`.
- [x] Unify Google BYOK priority across all generation modes (Speed, Reasoning, Expert).
- [x] Add pre-flight validation in `api/generate/route.ts` to return 400 when no functional key is configured.
- [x] Verify all OpenRouter free model IDs against `/api/v1/models` and replace invalid ones.
- [x] Reorder Speed mode cascade: `gemini-3.7-flash` → Nemotron 3.5 Lightning → GLM 5.2 → Laguna XS 2.1 → `gemini-3.6-flash` (last resort).
- [x] Reorder Reasoning mode cascade: `gemma-4-31b-it` → Nemotron 3 Ultra 550B → Gemma 4 26B → Gemma 4 31B free → `gemini-3.6-flash`.
- [x] Add 429/403 short-circuit in cascade catch block: when OpenRouter returns rate-limit, skip remaining OR models and return a clear user-facing message.
- [x] Update all i18n labels (EN/ES/FR/PT) to display Nemotron 3.5 Lightning (Speed) and Nemotron 3 Ultra 550B (Reasoning) as the new default models.
- [x] Update `HistoryList.getModelInfo` to correctly badge the new OR models.
- [x] Update `OnboardingWizard` free tier description to reference the new default models.

---

## Future Phases (Pending)

### Phase 8: Stabilization & Code Quality
- [ ] Fix 31 lint errors (mostly `any` types in AI routes + React hooks violations).
- [ ] Fix React hooks anti-patterns in 3 providers + `sheet.tsx` (setState in useEffect).
- [ ] Fix React Compiler memoization failures in `GenerateWorkspace.tsx`.
- [ ] Add `lib/pdf.ts` utility to deduplicate PDF generation logic.
- [ ] Create `supabase/schema.sql` with RLS policies.

### Phase 9: Testing
- [ ] Unit tests for `utils/limits.ts`, `utils/extract-company.ts`, `utils/ai-providers.ts` (>80% coverage).
- [ ] Integration tests for Server Actions and API routes.
- [ ] E2E tests with Playwright/Cypress for Auth, Generate, History flows.
- [ ] Add Zod validation to all Server Actions and API routes.

### Phase 10: Security & Scale
- [ ] Encrypt BYOK keys at rest (per-key encryption).
- [ ] Add rate limiting to API routes.
- [ ] Add error boundaries in dashboard layout.
- [ ] Extract service layer for business logic.

---

## Cascade Architecture (After Phase 7)

### Speed Mode
```
1. gemini-3.7-flash (Google direct)
2. nemotron-3.5-lightning (OpenRouter)  ← 429 → skip rest of OR
3. glm-5.2 (OpenRouter)
4. laguna-xs-2.1 (OpenRouter)
5. gemini-3.6-flash (Google direct, last resort)
```

### Reasoning Mode
```
1. gemma-4-31b-it (Google direct)
2. nemotron-3-ultra (OpenRouter)         ← 429 → skip rest of OR
3. gemma-4-26b (OpenRouter)
4. gemma-4-31b-it (OpenRouter free)
5. gemini-3.6-flash (Google direct, last resort)
```

### Verified OpenRouter Free Models (10 in cascade)
- Speed: Nemotron 3.5 Lightning, GLM 5.2, Laguna XS 2.1
- Reasoning: Nemotron 3 Ultra 550B, Gemma 4 26B, Gemma 4 31B
- Auxiliary: Laguna S 2.1, Ling 3.0 Flash Fin, Inkling, Auto-Router

> Note: All OpenRouter free models share a single 50 requests/day per-account quota. For production scale, load $5 USD of credit on the OpenRouter account to unlock ~5000 free-model generations.