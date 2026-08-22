# ✦ Nattitor | Vellura Execution Roadmap

This roadmap breaks down the construction of the Vellura Micro-SaaS into actionable, sequential phases. The AI Agent must mark checkboxes `[x]` as tasks are completed and commit the changes.

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
- [ ] Refactor `/dashboard/settings` to use a shadcn Tabs layout (Profile, AI & Usage, Preferences).
- [ ] Add BYOK (Bring Your Own Key) and Language Selectors (UI/Output) to the Settings preferences.
- [ ] Migrate database schema from `credits` to a `daily_limit` and `last_generation_date` system (3 free generations/day).
- [ ] Update `api/generate` to enforce the new Daily Limit logic and check for BYOK.
- [ ] Implement Dynamic Model Fallback in `api/generate` (switch models if primary fails/rate-limits).
- [ ] Enhance Generate UI: Add Premium Loading States (e.g., "Analyzing professional context...") and predefined Tone Select dropdown.
- [ ] Implement Session Timeout/Expiration in middleware (graceful redirect to `/login`).

## Phase 6: History & Final Polish
- [ ] Build the `/dashboard/history` page to fetch and display past generated documents.
- [ ] Implement `react-markdown` to render the AI output beautifully using a Serif font.
- [ ] Add Premium "Copy to Clipboard" overlay on output with 2-second checkmark success micro-interaction.
- [ ] Add "Export to PDF" functionality.
- [ ] Final Mobile-First QA (ensure responsive padding, no fake hovers, mobile menus work).
- [ ] Update SEO Metadata for the production deployment.
