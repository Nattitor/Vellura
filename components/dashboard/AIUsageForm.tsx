"use client";

import { useState, useTransition } from "react";
import { updateBYOK } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, KeyRound, Zap } from "lucide-react";

export function AIUsageForm({ dailyLimit, hasBYOK }: { dailyLimit: number; hasBYOK: boolean }) {
  const [key, setKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    if (!key.trim()) return;
    setStatus("idle");
    setErrorMessage("");
    
    startTransition(async () => {
      const result = await updateBYOK(key);
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("success");
        setKey(""); // Clear the input for security
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Daily Limits</h2>
          </div>
          <p className="text-sm text-zinc-400">
            You are currently on the free tier. Your limits reset every day at midnight UTC.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Remaining Generations Today</p>
            <p className="text-sm text-zinc-400">AI Cover Letters & Pitches</p>
          </div>
          <div className="text-3xl font-bold text-amethyst-glow">
            {hasBYOK ? "∞" : dailyLimit}
          </div>
        </div>
      </div>

      <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amethyst-glow" />
            <h2 className="text-xl font-semibold text-white">Bring Your Own Key (BYOK)</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Power users can bypass all daily limits by providing their own Google Gemini API Key. Your key is stored securely and never shared.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={hasBYOK ? "•••••••••••••••• (Key Active)" : "AIzaSy..."}
            className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-amethyst-glow"
            disabled={isPending}
          />

          {status === "error" && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending || !key.trim()}
              className="bg-zinc-100 hover:bg-white text-zinc-900 active:scale-[0.98] transition-transform min-w-[120px]"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : status === "success" ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
              ) : null}
              {status === "success" ? "Saved!" : "Save API Key"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
