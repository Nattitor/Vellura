export type AIProviderId = "google" | "openai" | "anthropic" | "deepseek" | "openrouter";

export interface AIModelDefinition {
  id: string;
  name: string;
  provider: AIProviderId;
  description: string;
  isFree?: boolean;
  badge?: string;
  recommendedFor?: "speed" | "reasoning" | "creative";
}

export interface AIProviderDefinition {
  id: AIProviderId;
  name: string;
  description: string;
  iconColor: string;
  placeholder: string;
  helpUrl: string;
}

export const AI_PROVIDERS: Record<AIProviderId, AIProviderDefinition> = {
  google: {
    id: "google",
    name: "Google Gemini",
    description: "Modelos Gemini 3.x y Gemma 4 de Google DeepMind.",
    iconColor: "text-amethyst-glow",
    placeholder: "AIzaSy...",
    helpUrl: "https://aistudio.google.com/app/apikey"
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "Familia GPT-5.6 (Sol, Luna, Terra) de OpenAI.",
    iconColor: "text-emerald-400",
    placeholder: "sk-proj-...",
    helpUrl: "https://platform.openai.com/api-keys"
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Modelos Claude 5 (Opus 5, Sonnet 5, Fable 5).",
    iconColor: "text-amber-400",
    placeholder: "sk-ant-...",
    helpUrl: "https://console.anthropic.com/settings/keys"
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek V4 Pro, Flash y V3.2.",
    iconColor: "text-cyan-400",
    placeholder: "sk-...",
    helpUrl: "https://platform.deepseek.com/api_keys"
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Acceso unificado a más de 400 modelos y modelos libres.",
    iconColor: "text-violet-400",
    placeholder: "sk-or-v1-...",
    helpUrl: "https://openrouter.ai/keys"
  }
};

export const AI_MODELS: AIModelDefinition[] = [
  // Google Gemini & Gemma
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "google",
    description: "Velocidad extrema y alta fidelidad profesional.",
    isFree: true,
    badge: "Default Speed",
    recommendedFor: "speed"
  },
  {
    id: "gemma-4-31b-it",
    name: "Gemma 4 31B (Reasoning)",
    provider: "google",
    description: "Razonamiento profundo con cadena de pensamiento nativa.",
    isFree: true,
    badge: "Default Reasoning",
    recommendedFor: "reasoning"
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    description: "El modelo Pro más potente de Google para análisis complejos.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "reasoning"
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "google",
    description: "Generación balanceada y ágil de documentos.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "google",
    description: "Máxima ligereza y baja latencia.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },

  // Anthropic Claude (All Paid / Require BYOK)
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    description: "Líder en redacción persuasiva y estilo profesional pulido.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "reasoning"
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    description: "Máxima inteligencia analítica y profundidad ejecutiva.",
    isFree: false,
    badge: "BYOK / Elite",
    recommendedFor: "reasoning"
  },
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "anthropic",
    description: "Narrativa atractiva y redacción con fuerte impacto emocional.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "creative"
  },

  // OpenAI (All Paid / Require BYOK)
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    description: "El buque insignia de OpenAI para generación y precisión.",
    isFree: false,
    badge: "BYOK / Frontier",
    recommendedFor: "reasoning"
  },
  {
    id: "gpt-5.6-luna-pro",
    name: "GPT-5.6 Luna Pro",
    provider: "openai",
    description: "Capacidad de razonamiento paso a paso avanzado.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "reasoning"
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    description: "Velocidad ágil y eficiencia en redacción de solicitudes.",
    isFree: false,
    badge: "BYOK / Speed",
    recommendedFor: "speed"
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    description: "Excelente balance entre rapidez y profundidad.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "speed"
  },

  // DeepSeek (All Paid / Require BYOK)
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "deepseek",
    description: "Razonamiento de vanguardia y arquitectura de última generación.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "reasoning"
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
    description: "Velocidad pura y respuesta instantánea.",
    isFree: false,
    badge: "BYOK / Speed",
    recommendedFor: "speed"
  },
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    description: "Modelo probado de alto rendimiento.",
    isFree: false,
    badge: "BYOK / Pro",
    recommendedFor: "speed"
  },

  // OpenRouter Free / Multi-Engine
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B (OpenRouter Free)",
    provider: "openrouter",
    description: "Acceso gratuito mediante OpenRouter con razonamiento integrado.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "reasoning"
  },
  {
    id: "openrouter/free",
    name: "Auto-Router (Best Free Model)",
    provider: "openrouter",
    description: "Enruta automáticamente a los mejores modelos gratuitos disponibles.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  }
];

// System defaults for standard non-expert users ($0 Cost)
export const DEFAULT_SPEED_MODEL = "gemini-3.7-flash";
export const DEFAULT_REASONING_MODEL = "gemma-4-31b-it";
