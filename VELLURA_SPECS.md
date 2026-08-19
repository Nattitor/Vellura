# ✦ Vellura | Architecture & Specification (SPECS.md)

## 1. Project Overview
**Name:** Vellura
**Type:** Micro-SaaS (AI Cover Letter & Pitch Generator)
**Goal:** Demonstrate Senior-level Full-Stack capabilities, API integrations, streaming states, database architecture, and SaaS product sense.

## 2. Tech Stack
* **Framework:** Next.js 15 (App Router, Server Components & Server Actions)
* **Styling:** Tailwind CSS + **shadcn/ui** (Radix UI primitives for accessible, premium components)
* **Database & Auth:** Supabase (PostgreSQL, SSR Auth via middleware)
* **AI Orchestration:** Vercel AI SDK (`ai` and `@ai-sdk/google`)
* **AI Models (Agnosticism):** Google Gemini 1.5 Flash (Primary) + OpenRouter/Groq (Fallback/Secondary option)
* **Markdown Rendering:** `react-markdown` with `remark-gfm`
* **PDF Export:** `html2pdf.js` or standard browser print window manipulation.

## 3. Core Features (The "Product" Feel)
1. **Model Agnosticism:** Users can select between "Speed (Gemini)" or "Reasoning (Alternative Model)" via a dropdown. The backend routes the request dynamically.
2. **Global User Context:** A Settings/Profile page where the user pastes their base Resume/Experience. This is stored in Supabase and silently injected into the AI system prompt to avoid repetitive typing.
3. **Real-time Streaming:** AI responses stream directly into the UI chunk-by-chunk using `useCompletion` or `useChat` from Vercel AI SDK.
4. **SaaS Monetization Logic:** A basic "Credit" system (e.g., 5 free credits). When credits reach 0, the generate button is disabled and triggers a "Pro Upgrade" modal (UI stub).
5. **Robust Error Handling:** Toast notifications for API timeouts, rate limits, or empty inputs.
6. **Data Persistence:** All generated cover letters are saved to the user's History dashboard.

## 4. Database Schema (Supabase)
We will need two primary tables (RLS enabled, restricted to authenticated users):

**Table: `profiles`**
* `id` (uuid, references `auth.users`)
* `resume_text` (text, nullable)
* `credits` (int, default 5)
* `created_at` (timestamp)

**Table: `documents`**
* `id` (uuid, primary key)
* `user_id` (uuid, references `profiles.id`)
* `company_name` (text)
* `job_description` (text)
* `generated_content` (text)
* `ai_model_used` (text)
* `created_at` (timestamp)

## 5. Design System & UI
* **Theme:** Dark mode strictly. Colors: Zinc/Slate base (`#09090b`), with an accent color of Electric Violet (`#8B5CF6`) or Neon Cyan (`#06b6d4`) for AI elements.
* **Component Library:** `shadcn/ui` (Buttons, Inputs, Select, Textarea, Skeleton, Toast, Dialog/Modal).
* **Typography:** Inter (Sans) for UI, readable Serif or clean Sans for the generated document output.
* **Auth UX (Split-Screen):** The `/login` page must use a modern Split-Screen layout. The left side showcases the brand, logo, and tagline: *"The intelligent workspace for your career."* The right side contains the functional Supabase auth form inside an `.ethereal-panel`.
* **UX Details:** Empty states with subtle SVGs/Icons if no history exists, loading skeletons, and button loading states (`disabled={isLoading}`).
