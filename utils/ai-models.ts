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

export const MODEL_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "gemini-3.7-flash": {
    English: "Extreme speed and high professional fidelity.",
    Spanish: "Velocidad extrema y alta fidelidad profesional.",
    French: "Vitesse extrême et haute fidélité professionnelle.",
    Portuguese: "Velocidade extrema e alta fidelidade profissional.",
  },
  "gemma-4-31b-it": {
    English: "Deep reasoning with native chain-of-thought.",
    Spanish: "Razonamiento profundo con cadena de pensamiento nativa.",
    French: "Raisonnement approfondi avec chaîne de pensée native.",
    Portuguese: "Raciocínio profundo com cadeia de pensamento nativa.",
  },
  "gemini-3.1-pro-preview": {
    English: "Google's most capable Pro model for complex analysis.",
    Spanish: "El modelo Pro más potente de Google para análisis complejos.",
    French: "Le modèle Pro le plus puissant de Google pour les analyses complexes.",
    Portuguese: "O modelo Pro mais poderoso do Google para análises complexas.",
  },
  "gemini-3.6-flash": {
    English: "Balanced and agile document generation.",
    Spanish: "Generación balanceada y ágil de documentos.",
    French: "Génération équilibrée et agile de documents.",
    Portuguese: "Geração equilibrada e ágil de documentos.",
  },
  "gemini-3.5-flash-lite": {
    English: "Maximum lightness and lowest latency.",
    Spanish: "Máxima ligereza y baja latencia.",
    French: "Légèreté maximale et latence minimale.",
    Portuguese: "Máxima leveza e menor latência.",
  },
  "claude-sonnet-5": {
    English: "Leader in persuasive writing and polished executive style.",
    Spanish: "Líder en redacción persuasiva y estilo profesional pulido.",
    French: "Leader en rédaction persuasive et style professionnel soigné.",
    Portuguese: "Líder em redação persuasiva e estilo profissional polido.",
  },
  "claude-opus-5": {
    English: "Peak analytical intelligence and executive depth.",
    Spanish: "Máxima inteligencia analítica y profundidad ejecutiva.",
    French: "Intelligence analytique maximale et profondeur exécutive.",
    Portuguese: "Máxima inteligência analítica e profundidade executiva.",
  },
  "claude-fable-5": {
    English: "Engaging narrative and writing with high emotional impact.",
    Spanish: "Narrativa atractiva y redacción con fuerte impacto emocional.",
    French: "Narration captivante et rédaction à fort impact émotionnel.",
    Portuguese: "Narrativa envolvente e redação com forte impacto emocional.",
  },
  "gpt-5.6-sol": {
    English: "OpenAI's flagship model for generation and accuracy.",
    Spanish: "El buque insignia de OpenAI para generación y precisión.",
    French: "Le fleuron d'OpenAI pour la génération et la précision.",
    Portuguese: "O carro-chefe da OpenAI para geração e precisão.",
  },
  "gpt-5.6-luna-pro": {
    English: "Advanced step-by-step reasoning capabilities.",
    Spanish: "Capacidad de razonamiento paso a paso avanzado.",
    French: "Capacités de raisonnement étape par étape avancées.",
    Portuguese: "Capacidades avançadas de raciocínio passo a passo.",
  },
  "gpt-5.6-terra": {
    English: "Agile speed and efficiency for pitch drafts.",
    Spanish: "Velocidad ágil y eficiencia en redacción de solicitudes.",
    French: "Vitesse agile et efficacité pour les candidatures.",
    Portuguese: "Velocidade ágil e eficiência na redação de candidaturas.",
  },
  "gpt-5.6-luna": {
    English: "Excellent balance between speed and depth.",
    Spanish: "Excelente balance entre rapidez y profundidad.",
    French: "Excellent équilibre entre rapidité et profondeur.",
    Portuguese: "Excelente equilíbrio entre rapidez e profundidade.",
  },
  "deepseek-v4-pro": {
    English: "Frontier reasoning and next-generation architecture.",
    Spanish: "Razonamiento de vanguardia y arquitectura de última generación.",
    French: "Raisonnement de pointe et architecture de nouvelle génération.",
    Portuguese: "Raciocínio de ponta e arquitetura de última geração.",
  },
  "deepseek-v4-flash": {
    English: "Pure speed and instantaneous responses.",
    Spanish: "Velocidad pura y respuesta instantánea.",
    French: "Vitesse pure et réponse instantanée.",
    Portuguese: "Velocidade pura e resposta instantânea.",
  },
  "deepseek-v3.2": {
    English: "Proven, battle-tested high-performance model.",
    Spanish: "Modelo probado de alto rendimiento.",
    French: "Modèle éprouvé à haute performance.",
    Portuguese: "Modelo comprovado de alto desempenho.",
  },
  "google/gemma-4-31b-it:free": {
    English: "Free access via OpenRouter with integrated reasoning.",
    Spanish: "Acceso gratuito mediante OpenRouter con razonamiento integrado.",
    French: "Accès gratuit via OpenRouter avec raisonnement intégré.",
    Portuguese: "Acesso gratuito via OpenRouter com raciocínio integrado.",
  },
  "openrouter/free": {
    English: "Auto-routes to the best available free frontier models.",
    Spanish: "Enruta automáticamente a los mejores modelos gratuitos disponibles.",
    French: "Achemine automatiquement vers les meilleurs modèles gratuits.",
    Portuguese: "Roteia automaticamente para os melhores modelos gratuitos.",
  },
  "glm-5.3-flash": {
    English: "Ultra-fast response with high efficiency for document transcription.",
    Spanish: "Respuesta ultra-rápida y alta eficiencia en transcripción de documentos.",
    French: "Réponse ultra-rapide et haute efficacité pour la transcription.",
    Portuguese: "Resposta ultrarrápida e alta eficiência para transcrição de documentos.",
  },
  "z-ai/glm-5.2:free": {
    English: "Fast and efficient model from Z.ai, ideal for document generation.",
    Spanish: "Modelo rápido y eficiente de Z.ai, ideal para generación de documentos.",
    French: "Modèle rapide et efficace de Z.ai, idéal pour la génération de documents.",
    Portuguese: "Modelo rápido e eficiente da Z.ai, ideal para geração de documentos.",
  },
  "inclusionai/ling-3.0-flash-fin:free": {
    English: "Inclusion AI's model optimized for speed and efficiency.",
    Spanish: "Modelo de Inclusion AI optimizado para velocidad y eficiencia.",
    French: "Modèle d'Inclusion AI optimisé pour la vitesse et l'efficacité.",
    Portuguese: "Modelo da Inclusion AI otimizado para velocidade e eficiência.",
  },
  "thinkingmachines/inkling:free": {
    English: "Thinking Machines' model with balanced reasoning.",
    Spanish: "Modelo de Thinking Machines con razonamiento balanceado.",
    French: "Modèle de Thinking Machines avec raisonnement équilibré.",
    Portuguese: "Modelo da Thinking Machines com raciocínio balanceado.",
  },
  "thinkingmachines/inkling-small:free": {
    English: "Lighter version of Inkling, faster and lower cost.",
    Spanish: "Versión ligera de Inkling, más rápida y de menor costo.",
    French: "Version légère d'Inkling, plus rapide et moins coûteuse.",
    Portuguese: "Versão leve do Inkling, mais rápida e de menor custo.",
  },
  "poolside/laguna-s-2.1:free": {
    English: "Poolside's medium-sized model with a good speed/quality balance.",
    Spanish: "Modelo de Poolside de tamaño medio con buen balance velocidad/calidad.",
    French: "Modèle de Poolside de taille moyenne avec un bon équilibre vitesse/qualité.",
    Portuguese: "Modelo da Poolside de tamanho médio com bom equilíbrio velocidade/qualidade.",
  },
  "poolside/laguna-xs-2.1:free": {
    English: "Extra small version of Laguna, maximum speed.",
    Spanish: "Versión extra pequeña de Laguna, máxima velocidad.",
    French: "Version extra-petite de Laguna, vitesse maximale.",
    Portuguese: "Versão extra pequena do Laguna, velocidade máxima.",
  },
  "nvidia/nemotron-3.5-lightning:free": {
    English: "NVIDIA's lightning model, ultra-fast for immediate responses.",
    Spanish: "Modelo lightning de NVIDIA, ultrarrápido para respuestas inmediatas.",
    French: "Modèle lightning de NVIDIA, ultra-rapide pour des réponses immédiates.",
    Portuguese: "Modelo lightning da NVIDIA, ultrarrápido para respostas imediatas.",
  },
  "nvidia/nemotron-3-ultra-550b-a55b:free": {
    English: "NVIDIA's massive model with deep reasoning and high quality.",
    Spanish: "Modelo masivo de NVIDIA con razonamiento profundo y alta calidad.",
    French: "Modèle massif de NVIDIA avec raisonnement profond et haute qualité.",
    Portuguese: "Modelo massivo da NVIDIA com raciocínio profundo e alta qualidade.",
  },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    English: "NVIDIA's large model with excellent reasoning for complex analysis.",
    Spanish: "Modelo grande de NVIDIA con excelente razonamiento para análisis complejos.",
    French: "Grand modèle de NVIDIA avec excellent raisonnement pour analyses complexes.",
    Portuguese: "Modelo grande da NVIDIA com excelente raciocínio para análises complexas.",
  },
};

export const PROVIDER_DESCRIPTIONS: Record<AIProviderId, Record<string, string>> = {
  google: {
    English: "Gemini 3.x and Gemma 4 models by Google DeepMind.",
    Spanish: "Modelos Gemini 3.x y Gemma 4 de Google DeepMind.",
    French: "Modèles Gemini 3.x et Gemma 4 de Google DeepMind.",
    Portuguese: "Modelos Gemini 3.x e Gemma 4 do Google DeepMind.",
  },
  openai: {
    English: "GPT-5.6 family (Sol, Luna, Terra) by OpenAI.",
    Spanish: "Familia GPT-5.6 (Sol, Luna, Terra) de OpenAI.",
    French: "Famille GPT-5.6 (Sol, Luna, Terra) d'OpenAI.",
    Portuguese: "Família GPT-5.6 (Sol, Luna, Terra) da OpenAI.",
  },
  anthropic: {
    English: "Claude 5 models (Opus 5, Sonnet 5, Fable 5).",
    Spanish: "Modelos Claude 5 (Opus 5, Sonnet 5, Fable 5).",
    French: "Modèles Claude 5 (Opus 5, Sonnet 5, Fable 5).",
    Portuguese: "Modelos Claude 5 (Opus 5, Sonnet 5, Fable 5).",
  },
  deepseek: {
    English: "DeepSeek V4 Pro, Flash, and V3.2 models.",
    Spanish: "Modelos DeepSeek V4 Pro, Flash y V3.2.",
    French: "Modèles DeepSeek V4 Pro, Flash et V3.2.",
    Portuguese: "Modelos DeepSeek V4 Pro, Flash e V3.2.",
  },
  openrouter: {
    English: "Unified access to 400+ models and free endpoints.",
    Spanish: "Acceso unificado a más de 400 modelos y modelos libres.",
    French: "Accès unifié à plus de 400 modèles et endpoints gratuits.",
    Portuguese: "Acesso unificado a mais de 400 modelos e opções gratuitas.",
  },
};

export function getModelDescription(modelId: string, lang: string = "Spanish"): string {
  const model = MODEL_DESCRIPTIONS[modelId];
  if (model) {
    return model[lang] || model["Spanish"] || model["English"] || "";
  }
  const fallback = AI_MODELS.find((m) => m.id === modelId);
  return fallback?.description || "";
}

export function getProviderDescription(providerId: AIProviderId, lang: string = "Spanish"): string {
  const prov = PROVIDER_DESCRIPTIONS[providerId];
  if (prov) {
    return prov[lang] || prov["Spanish"] || prov["English"] || "";
  }
  return AI_PROVIDERS[providerId]?.description || "";
}

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

  // OpenRouter Free / Multi-Engine (IDs verificados contra /api/v1/models)
  {
    id: "z-ai/glm-5.2:free",
    name: "GLM 5.2 (Free)",
    provider: "openrouter",
    description: "Modelo rápido y eficiente de Z.ai, ideal para generación de documentos.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "inclusionai/ling-3.0-flash-fin:free",
    name: "Ling 3.0 Flash Fin (Free)",
    provider: "openrouter",
    description: "Modelo de Inclusion AI optimizado para velocidad y eficiencia.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "thinkingmachines/inkling:free",
    name: "Inkling (Free)",
    provider: "openrouter",
    description: "Modelo de Thinking Machines con razonamiento balanceado.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "thinkingmachines/inkling-small:free",
    name: "Inkling Small (Free)",
    provider: "openrouter",
    description: "Versión ligera de Inkling, más rápida y de menor costo.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "poolside/laguna-s-2.1:free",
    name: "Laguna S 2.1 (Free)",
    provider: "openrouter",
    description: "Modelo de Poolside de tamaño medio con buen balance velocidad/calidad.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "poolside/laguna-xs-2.1:free",
    name: "Laguna XS 2.1 (Free)",
    provider: "openrouter",
    description: "Versión extra pequeña de Laguna, máxima velocidad.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    name: "Nemotron 3.5 Lightning (Free)",
    provider: "openrouter",
    description: "Modelo lightning de NVIDIA, ultrarrápido para respuestas inmediatas.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "speed"
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "Nemotron 3 Ultra 550B (Free)",
    provider: "openrouter",
    description: "Modelo masivo de NVIDIA con razonamiento profundo y alta calidad.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "reasoning"
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super 120B (Free)",
    provider: "openrouter",
    description: "Modelo grande de NVIDIA con excelente razonamiento para análisis complejos.",
    isFree: true,
    badge: "Free Tier",
    recommendedFor: "reasoning"
  },
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
  },
];

// System defaults for standard non-expert users ($0 Cost)
export const DEFAULT_SPEED_MODEL = "gemini-3.7-flash";
export const DEFAULT_REASONING_MODEL = "gemma-4-31b-it";
