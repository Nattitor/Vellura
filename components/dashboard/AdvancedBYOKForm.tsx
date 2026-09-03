"use client";

import { useState, useTransition } from "react";
import { updateProviderKey } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Key, Shield, ExternalLink, Trash2 } from "lucide-react";
import { AI_PROVIDERS, AIProviderId } from "@/utils/ai-models";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "sonner";

export function AdvancedBYOKForm({ initialConfiguredProviders = [] }: { initialConfiguredProviders?: string[] }) {
  const { t } = useLanguage();
  // `keys` only ever tracks WHICH providers are connected (boolean flags).
  // Actual key values never reach this client component; they are entered
  // once by the user, sent to the Server Action, and encrypted server-side.
  const [keys, setKeys] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialConfiguredProviders.map((p) => [p, true]))
  );
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [activeProvider, setActiveProvider] = useState<AIProviderId>("google");
  const [isPending, startTransition] = useTransition();

  const getProviderDescription = (provider: AIProviderId) => {
    switch (provider) {
      case "google":
        return t.settings.providerGoogleDesc || AI_PROVIDERS.google.description;
      case "openai":
        return t.settings.providerOpenAIDesc || AI_PROVIDERS.openai.description;
      case "anthropic":
        return t.settings.providerAnthropicDesc || AI_PROVIDERS.anthropic.description;
      case "deepseek":
        return t.settings.providerDeepSeekDesc || AI_PROVIDERS.deepseek.description;
      case "openrouter":
        return t.settings.providerOpenRouterDesc || AI_PROVIDERS.openrouter.description;
      case "groq":
        return AI_PROVIDERS.groq.description;
      default:
        return "";
    }
  };

  const handleSave = (provider: AIProviderId) => {
    const keyVal = (inputs[provider] || "").trim();
    if (!keyVal) return;

    startTransition(async () => {
      const result = await updateProviderKey(provider, keyVal);
      if (result.error) {
        toast.error(`Error: ${result.error}`);
      } else {
        setKeys((prev) => ({ ...prev, [provider]: true }));
        setInputs((prev) => ({ ...prev, [provider]: "" }));
        toast.success(`${AI_PROVIDERS[provider].name} API Key connected securely!`);
      }
    });
  };

  const handleRemove = (provider: AIProviderId) => {
    startTransition(async () => {
      const result = await updateProviderKey(provider, "");
      if (result.error) {
        toast.error(`Error: ${result.error}`);
      } else {
        setKeys((prev) => {
          const next = { ...prev };
          delete next[provider];
          return next;
        });
        toast.info(`${AI_PROVIDERS[provider].name} API Key disconnected.`);
      }
    });
  };

  const providerList: AIProviderId[] = ["google", "groq", "openai", "anthropic", "deepseek", "openrouter"];

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Key className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t.settings.byokIntegrationsTitle || "AI Provider Integrations (BYOK)"}
            </h2>
            <p className="text-xs text-zinc-400">
              {t.settings.byokIntegrationsDesc || "Connect your personal API keys to unlock frontier models with unlimited generations."}
            </p>
          </div>
        </div>
      </div>

      {/* Unlimited BYOK Explanation Banner */}
      <div className="flex items-center gap-3 p-3.5 bg-cyan-950/30 border border-cyan-500/25 rounded-xl relative z-10 text-xs text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.08)]">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-sm">
          ♾️
        </div>
        <p className="leading-relaxed text-xs text-zinc-300">
          <strong className="text-cyan-300 font-semibold">{t.settings.byokUnlimitedTitle || "Generaciones 100% Ilimitadas:"}</strong>{" "}
          {t.settings.byokUnlimitedDesc || "Al conectar tus claves API, tus documentos generados en Modo Experto no consumen tu límite diario."}
        </p>
      </div>

      {/* Provider Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 relative z-10">
        {providerList.map((pId) => {
          const prov = AI_PROVIDERS[pId];
          const isConnected = !!keys[pId];
          const isSelected = activeProvider === pId;

          return (
            <button
              key={pId}
              type="button"
              onClick={() => setActiveProvider(pId)}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? "bg-white/10 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate">{prov.name}</span>
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1">
                {isConnected ? (t.settings.statusActive || "Active") : (t.settings.statusNotConnected || "Not connected")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Provider Config Box */}
      {activeProvider && (
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4 relative z-10 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  {AI_PROVIDERS[activeProvider].name}
                </h3>
                {keys[activeProvider] ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {t.settings.statusConnected || "Connected"}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5 font-medium">
                    {t.settings.statusOptional || "Optional"}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {getProviderDescription(activeProvider)}
              </p>
            </div>

            <a
              href={AI_PROVIDERS[activeProvider].helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>{t.settings.getKey || "Get Key"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {keys[activeProvider] ? (
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/80 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-mono text-zinc-300">••••••••••••••••••••••••••••</p>
                  <p className="text-[10px] text-zinc-500">
                    {t.settings.keyStoredSecurely || "Key stored securely for this account."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(activeProvider)}
                disabled={isPending}
                className="h-8 px-3 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {t.settings.disconnectBtn || "Disconnect"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={inputs[activeProvider] || ""}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [activeProvider]: e.target.value }))
                }
                placeholder={AI_PROVIDERS[activeProvider].placeholder}
                className="bg-zinc-950/70 border-white/10 text-white text-xs h-10 focus-visible:ring-cyan-500 font-mono"
                disabled={isPending}
              />
              <Button
                type="button"
                onClick={() => handleSave(activeProvider)}
                disabled={isPending || !(inputs[activeProvider] || "").trim()}
                className="h-10 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shrink-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                {t.settings.saveKeyBtn || "Save Key"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
