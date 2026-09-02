export type ModelProviderTag = "google" | "openai" | "anthropic" | "deepseek" | "openrouter" | "other";

export interface ModelDisplayInfo {
  label: string;
  provider: ModelProviderTag;
  badgeColor: string;
}

/**
 * Maps a raw model identifier (as returned by the backend cascade via the
 * `X-AI-Model` header, or stored in `documents.ai_model_used`) to a
 * human-friendly label, provider tag, and badge color.
 *
 * Shared between the live generator (`GenerateWorkspace`) and the history
 * list (`HistoryList`) so both surfaces stay consistent. Previously this
 * mapping was duplicated in `HistoryList.tsx` only.
 */
export function getModelDisplayInfo(modelName: string = ""): ModelDisplayInfo {
  const lower = modelName.toLowerCase();
  if (lower.includes("terra")) return { label: "GPT-5.6 Terra", provider: "openai", badgeColor: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" };
  if (lower.includes("luna")) return { label: "GPT-5.6 Luna", provider: "openai", badgeColor: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" };
  if (lower.includes("sol")) return { label: "GPT-5.6 Sol", provider: "openai", badgeColor: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" };
  if (lower.includes("opus")) return { label: "Claude 5 Opus", provider: "anthropic", badgeColor: "border-amber-500/30 bg-amber-950/50 text-amber-300" };
  if (lower.includes("sonnet")) return { label: "Claude 5 Sonnet", provider: "anthropic", badgeColor: "border-amber-500/30 bg-amber-950/50 text-amber-300" };
  if (lower.includes("fable")) return { label: "Claude 5 Fable", provider: "anthropic", badgeColor: "border-amber-500/30 bg-amber-950/50 text-amber-300" };
  if (lower.includes("deepseek-v4-pro") || lower.includes("deepseek-v3.2")) return { label: "DeepSeek V4", provider: "deepseek", badgeColor: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300" };
  if (lower.includes("nemotron-3-ultra")) return { label: "Nemotron 3 Ultra 550B", provider: "openrouter", badgeColor: "border-amber-500/30 bg-amber-950/50 text-amber-300" };
  if (lower.includes("nemotron-3-super")) return { label: "Nemotron 3 Super 120B", provider: "openrouter", badgeColor: "border-amber-500/30 bg-amber-950/50 text-amber-300" };
  if (lower.includes("nemotron-3.5")) return { label: "Nemotron 3.5 Lightning", provider: "openrouter", badgeColor: "border-amber-500/30 bg-amber-950/50 text-amber-300" };
  if (lower.includes("gemma-4-26b")) return { label: "Gemma 4 26B", provider: "openrouter", badgeColor: "border-amethyst-glow/30 bg-purple-950/50 text-purple-300" };
  if (lower.includes("gemma-4-31b")) return { label: "Gemma 4 31B", provider: "google", badgeColor: "border-amethyst-glow/30 bg-purple-950/50 text-purple-300" };
  if (lower.includes("gemma")) return { label: "Gemma 4 31B", provider: "google", badgeColor: "border-amethyst-glow/30 bg-purple-950/50 text-purple-300" };
  if (lower.includes("laguna-xs")) return { label: "Laguna XS 2.1", provider: "openrouter", badgeColor: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" };
  if (lower.includes("laguna-s")) return { label: "Laguna S 2.1", provider: "openrouter", badgeColor: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" };
  if (lower.includes("inkling-small")) return { label: "Inkling Small", provider: "openrouter", badgeColor: "border-violet-500/30 bg-violet-950/50 text-violet-300" };
  if (lower.includes("inkling")) return { label: "Inkling", provider: "openrouter", badgeColor: "border-violet-500/30 bg-violet-950/50 text-violet-300" };
  if (lower.includes("ling-3.0")) return { label: "Ling 3.0 Flash Fin", provider: "openrouter", badgeColor: "border-violet-500/30 bg-violet-950/50 text-violet-300" };
  if (lower.includes("glm-5.2")) return { label: "GLM 5.2", provider: "openrouter", badgeColor: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300" };
  if (lower.includes("glm-5.3")) return { label: "GLM 5.3 Flash", provider: "openrouter", badgeColor: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300" };
  if (lower.includes("gemini-3.7-flash")) return { label: "Gemini 3.7 Flash", provider: "google", badgeColor: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300" };
  if (lower.includes("gemini-3.6-flash")) return { label: "Gemini 3.6 Flash", provider: "google", badgeColor: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300" };
  if (lower.includes("gemini-3.5")) return { label: "Gemini 3.5 Flash Lite", provider: "google", badgeColor: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300" };
  if (lower.includes("gemini-3.1-pro")) return { label: "Gemini 3.1 Pro", provider: "google", badgeColor: "border-amethyst-glow/30 bg-purple-950/50 text-purple-300" };
  if (lower.includes("pro")) return { label: "Gemini 3.1 Pro", provider: "google", badgeColor: "border-amethyst-glow/30 bg-purple-950/50 text-purple-300" };
  if (lower.includes("openrouter")) return { label: "OpenRouter", provider: "openrouter", badgeColor: "border-violet-500/30 bg-violet-950/50 text-violet-300" };
  return { label: modelName.split("/").pop() || "AI Model", provider: "other", badgeColor: "border-white/10 bg-zinc-900 text-zinc-300" };
}
