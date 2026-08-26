"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { AIUsageForm } from "@/components/dashboard/AIUsageForm";
import { PreferencesForm } from "@/components/dashboard/PreferencesForm";
import { AdvancedBYOKForm } from "@/components/dashboard/AdvancedBYOKForm";
import { User, Cpu } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface SettingsViewProps {
  initialResume: string;
  outputLanguage: string;
  dailyLimit: number;
  hasBYOK: boolean;
  userKeys: Record<string, string>;
}

export function SettingsView({
  initialResume,
  outputLanguage,
  dailyLimit,
  hasBYOK,
  userKeys,
}: SettingsViewProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"general" | "advanced">(
    tabParam === "advanced" ? "advanced" : "general"
  );

  useEffect(() => {
    if (tabParam === "advanced") {
      setActiveTab("advanced");
    }
  }, [tabParam]);

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4 text-amethyst-glow" />
          <span>{t.settings.generalTab || "General & Master Resume"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("advanced")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "advanced"
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>{t.settings.advancedTab || "Avanzado & API Keys (BYOK)"}</span>
          {Object.keys(userKeys).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "general" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-200">
          {/* Left Column: Context */}
          <div className="xl:col-span-2 space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amethyst-glow/20 to-cyan-400/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative">
                <ProfileForm
                  initialResume={initialResume}
                  outputLanguage={outputLanguage}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Usage & Preferences */}
          <div className="space-y-8">
            <AIUsageForm dailyLimit={dailyLimit} hasBYOK={hasBYOK} />
            <PreferencesForm initialOutputLanguage={outputLanguage} />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl animate-in fade-in duration-200">
          <AdvancedBYOKForm initialKeys={userKeys} />
        </div>
      )}
    </div>
  );
}
