# ✦ Vellura

![Vellura Banner](public/preview.webp) <!-- Placeholder for future screenshot -->

> **The intelligent workspace for your career.**

Vellura is a Full-Stack Micro-SaaS application designed to generate hyper-personalized cover letters and pitches. Built with a focus on **Senior-level engineering standards**, it features real-time AI streaming, robust state management, secure database architecture, and strict "Ethereal Minimalist" design principles.

---

## 🚀 Key Features

*   **Real-Time AI Streaming:** Utilizes the Vercel AI SDK to stream responses chunk-by-chunk, providing immediate visual feedback without long loading spinners.
*   **Model Agnosticism:** Dynamically routes requests between Google Gemini 1.5 (Primary) and alternative LLMs based on user selection.
*   **Global User Context:** Users store their base resume/experience in a secure Supabase profile. This context is silently injected into the AI system prompt to eliminate repetitive data entry.
*   **SaaS Mechanics (Credits System):** Implements a functional database-driven credit system. Users consume credits per generation, showcasing real-world monetization logic.
*   **Persistent History:** All generated documents are securely saved to a PostgreSQL database (Supabase) with Row Level Security (RLS) enabled.
*   **Professional Export:** Supports rich Markdown rendering and one-click PDF exports.

## 🛠 Tech Stack

*   **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
*   **AI Engine:** Vercel AI SDK (`ai`, `@ai-sdk/google`) & Google Gemini API
*   **Database & Auth:** Supabase (PostgreSQL, SSR Middleware Authentication)
*   **Styling:** Tailwind CSS + shadcn/ui (Radix Primitives)

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
Create a `.env.local` file in the root directory and add your Supabase and Gemini API keys.

### 4. Run the Development Server
```bash
npm run dev
```

---
*Designed and engineered as part of the Nattitor portfolio.*
