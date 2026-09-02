"use client";

import { useState, useTransition } from "react";
import { updateBYOK } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Zap, Key, Shield } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { DEFAULT_DAILY_LIMIT } from "@/utils/limits";
import { toast } from "sonner";

export function AIUsageForm({ dailyLimit, hasBYOK }: { dailyLimit: number; hasBYOK: boolean }) {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveKey = () => {
    if (!apiKey.trim()) return;
    setStatus("idle");
    setErrorMessage("");
    
    startTransition(async () => {
      const result = await updateBYOK(apiKey);
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("success");
        setApiKey("");
        toast.success("API Key updated successfully");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  };

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6 relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-1000" />

      {/* Daily Limits Section */}
      <div className="flex flex-col space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amethyst-glow shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">{t.settings.dailyLimits}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{t.settings.dailyLimitsDesc}</p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 pl-3">
            <span className="text-xl font-bold font-mono text-white tracking-tight">
              {dailyLimit}
              <span className="text-xs text-zinc-500 font-normal ml-1">/ {DEFAULT_DAILY_LIMIT}</span>
            </span>
            <span className="text-[10px] text-amethyst-glow font-medium">
              {t.settings.remainingGen}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5 relative z-10" />

      {/* BYOK Section */}
      <div className="flex flex-col space-y-3 relative z-10">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">{t.settings.byokTitle}</h3>
        </div>
        <p className="text-xs text-zinc-400">
          {t.settings.byokDesc}
        </p>

        {!hasBYOK ? (
          <div className="flex items-center gap-3 pt-1">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="bg-zinc-900/50 border-white/10 text-white text-xs h-9 focus-visible:ring-cyan-500"
              disabled={isPending}
            />
            <Button
              onClick={handleSaveKey}
              disabled={isPending || !apiKey.trim()}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-9 px-4 transition-colors border border-white/10 shrink-0"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : status === "success" ? (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
              ) : null}
              {isPending ? t.settings.saving : status === "success" ? t.settings.saved : t.settings.saveKey}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-cyan-950/30 border border-cyan-500/20 px-3.5 py-2.5 rounded-lg">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-xs text-cyan-100 font-medium">{t.settings.keyStoredSecurely || "Tu clave API está activa y almacenada de forma segura."}</p>
          </div>
        )}

        {status === "error" && (
          <p className="text-xs text-red-500">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
