"use client";

import { Settings } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export function SettingsHeader({ completionPercentage }: { completionPercentage: number }) {
  const { t } = useLanguage();

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8 text-amethyst-glow" />
          {t.settings.title}
        </h1>
        <p className="text-zinc-400">{t.settings.subtitle}</p>
      </div>
      
      {/* Profile Completion Indicator */}
      <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
        <div className="text-sm font-medium text-zinc-300">{t.settings.profileSetup}</div>
        <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amethyst-glow to-cyan-400 transition-all duration-1000" 
            style={{ width: `${Math.max(completionPercentage, 10)}%` }}
          />
        </div>
        <div className="text-xs font-bold text-white">{completionPercentage}%</div>
      </div>
    </div>
  );
}
