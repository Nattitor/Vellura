import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { AIProviderId, DEFAULT_SPEED_MODEL, DEFAULT_REASONING_MODEL, AI_MODELS } from "./ai-models";

export interface ProviderResolutionParams {
  providerId?: AIProviderId;
  modelId?: string;
  mode?: "speed" | "reasoning" | "expert";
  userKeys?: Record<string, string>;
  systemGoogleKey?: string;
}

export function resolveAIModel(params: ProviderResolutionParams) {
  const { providerId, modelId, mode = "speed", userKeys = {}, systemGoogleKey } = params;

  // 1. STANDARD NON-EXPERT MODE (Zero cost system models using system key)
    if (mode === "speed") {
      const googleApiKey = userKeys.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!googleApiKey) {
        throw new Error("No Google AI API key available. Speed mode requires a Google key as last resort.");
      }
      const googleClient = createGoogleGenerativeAI({ apiKey: googleApiKey });
      return {
        model: googleClient(DEFAULT_SPEED_MODEL),
        modelName: DEFAULT_SPEED_MODEL,
        provider: "google" as AIProviderId,
      };
    }

    if (mode === "reasoning") {
      const googleApiKey = userKeys.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!googleApiKey) {
        throw new Error("No Google AI API key available. Reasoning mode requires a Google key as last resort.");
      }
      const googleClient = createGoogleGenerativeAI({ apiKey: googleApiKey });
      return {
        model: googleClient(DEFAULT_REASONING_MODEL),
        modelName: DEFAULT_REASONING_MODEL,
        provider: "google" as AIProviderId,
      };
    }

  // 2. EXPERT MODE / BYOK
  const targetModel = AI_MODELS.find((m) => m.id === modelId);
  const effectiveProvider: AIProviderId = providerId || targetModel?.provider || "google";
  const effectiveModelId = modelId || DEFAULT_SPEED_MODEL;

  switch (effectiveProvider) {
    case "openai": {
      const apiKey = userKeys.openai || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key is required to use OpenAI models. Please add your key in Settings > Advanced.");
      }
      const openaiClient = createOpenAI({ apiKey });
      return {
        model: openaiClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "openai" as AIProviderId,
      };
    }

    case "anthropic": {
      const apiKey = userKeys.anthropic || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("Anthropic API key is required to use Claude models. Please add your key in Settings > Advanced.");
      }
      const anthropicClient = createAnthropic({ apiKey });
      return {
        model: anthropicClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "anthropic" as AIProviderId,
      };
    }

    case "deepseek": {
      const apiKey = userKeys.deepseek || process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("DeepSeek API key is required to use DeepSeek models. Please add your key in Settings > Advanced.");
      }
      const deepseekClient = createOpenAI({
        baseURL: "https://api.deepseek.com/v1",
        apiKey,
      });
      return {
        model: deepseekClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "deepseek" as AIProviderId,
      };
    }

    case "openrouter": {
          const hasApiKey = !!(userKeys.openrouter || process.env.OPENROUTER_API_KEY);
          if (!hasApiKey && !targetModel?.isFree) {
            throw new Error("OpenRouter API key is required for premium OpenRouter models. Please add your key in Settings > Advanced.");
          }
          const effectiveKey = userKeys.openrouter || process.env.OPENROUTER_API_KEY || "";
          const openrouterClient = createOpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: effectiveKey,
        headers: {
          "HTTP-Referer": "https://vellura.ai",
          "X-Title": "Vellura AI Workspace",
        },
      });
      return {
        model: openrouterClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "openrouter" as AIProviderId,
      };
    }

    case "google":
    default: {
      const apiKey = userKeys.google || systemGoogleKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const googleClient = createGoogleGenerativeAI({ apiKey });
      return {
        model: googleClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "google" as AIProviderId,
      };
    }
  }
}
