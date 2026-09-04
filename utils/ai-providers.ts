import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { AIProviderId, AI_MODELS } from "./ai-models";

export interface ProviderResolutionParams {
  providerId?: AIProviderId;
  modelId?: string;
  mode?: "expert";
  userKeys?: Record<string, string>;
  systemGoogleKey?: string;
}

export function resolveAIModel(params: ProviderResolutionParams) {
  const { providerId, modelId, mode = "expert", userKeys = {}, systemGoogleKey } = params;

  if (mode !== "expert") {
    throw new Error(`Unsupported mode "${mode}". resolveAIModel only handles Expert Mode; Speed/Reasoning use the inline cascade in app/api/generate/route.ts.`);
  }

  // EXPERT MODE / BYOK
  // Security: the model MUST exist in our catalog and the provider MUST match it.
  // This prevents clients from invoking arbitrary model IDs on providers directly.
  const targetModel = AI_MODELS.find((m) => m.id === modelId);
  if (!targetModel) {
    throw new Error("Selected model is not recognized. Please choose a model from the catalog.");
  }
  if (providerId && providerId !== targetModel.provider) {
    throw new Error("Provider does not match the selected model.");
  }
  const effectiveProvider: AIProviderId = targetModel.provider;
  const effectiveModelId = targetModel.id;

  switch (effectiveProvider) {
    case "openai": {
      // BYOK-only provider: never fall back to a system/env key. A shared system
      // key here would let any authenticated user spend the admin's paid quota.
      const apiKey = userKeys.openai;
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
      // BYOK-only provider: never fall back to a system/env key.
      const apiKey = userKeys.anthropic;
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
      // BYOK-only provider: never fall back to a system/env key.
      const apiKey = userKeys.deepseek;
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
          "HTTP-Referer": "https://vellura-ai.vercel.app",
          "X-Title": "Vellura AI Workspace",
        },
      });
      return {
        model: openrouterClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "openrouter" as AIProviderId,
      };
    }

    case "groq": {
      // Groq direct (OpenAI-compatible endpoint). System key covers the free
      // cascade; BYOK key unlocks Expert Mode on the user's own quota.
      const apiKey = userKeys.groq || process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key is required. Get a free one (no credit card) at https://console.groq.com/keys or add yours in Settings > Advanced.");
      }
      const groqClient = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey,
      });
      return {
        model: groqClient(effectiveModelId),
        modelName: effectiveModelId,
        provider: "groq" as AIProviderId,
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
