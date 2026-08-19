# ✦ Nattitor | Vellura Code Style

This document defines the **Design Signature** and **Engineering Standards** specifically for the *Vellura* project. It adapts the core Nattitor engineering principles into a sleek, consumer-facing SaaS aesthetic designed for generative AI interactions.

---

## 1. Design Signature: "AI Ethereal & Minimalist"

While Nattitor's roots are in Dark Brutalism, Vellura demonstrates versatility through a highly structured, refined, and minimalist approach.
- **Dark Mode Native:** Deep, immersive backgrounds, but with softer contrast than our brutalist projects.
- **Symmetrical & Breathable:** Layouts must feel centered, structured, and use generous whitespace (or darkspace) to reduce cognitive load. 
- **Focus on the Content:** The UI should get out of the way to let the AI-generated text shine.

### 1.1 Color Palette
- **Deep Void (Backgrounds):** `#09090B` (Zinc 950) or `#0A0E17`.
- **Amethyst Glow (Primary Accent):** `#8B5CF6` (Violet 500) — Used for primary CTAs and AI-active states.
- **Neon Cyan (Secondary Accent):** `#06B6D4` (Cyan 500) — Used for subtle gradients mixed with Violet.
- **Glass/Borders:** `rgba(255, 255, 255, 0.05)` — Borders are barely visible, creating a smooth transition.

### 1.2 Typography
- **Primary Font:** *Geist Sans* or *Inter*. Extremely clean, highly readable, standard for premium SaaS.
- **Generated Content:** *Geist Serif* or a clean Serif for the generated Cover Letters to give them a "document" feel.
- **Metadata:** *JetBrains Mono* strictly reserved for credit counters, model names, or code snippets.

### 1.3 The "Ethereal Panel" Standard
Cards and panels use a softer glass effect than our brutalist projects:
```css
.ethereal-panel {
  @apply bg-zinc-950/50 border border-white/5 backdrop-blur-md rounded-xl shadow-lg;
}
```

---

## 2. Interaction Design (UX/Motion)

### 2.1 The Nattitor Physics (Retained)
We keep our signature heavy, premium spring physics for all buttons and modals to maintain brand consistency.

### 2.2 Mobile UX First
- **No Fake Hover:** Continue using `md:hover:` to prevent sticky hover states on mobile.
- **Tactile Feedback:** Use `active:scale-95` on all buttons for immediate physical feedback.

### 2.3 "Magic UI" (AI-Specific Micro-interactions)
- **Thinking State:** When the AI is generating, the primary CTA should feature an animated gradient border (shimmer effect).
- **Text Streaming:** The Vercel AI SDK output must feel smooth, simulating a human typing rapidly, rather than appearing in jarring blocks.
