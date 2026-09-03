"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { AIUsageForm } from "@/components/dashboard/AIUsageForm";
import { PreferencesForm } from "@/components/dashboard/PreferencesForm";
import { AdvancedBYOKForm } from "@/components/dashboard/AdvancedBYOKForm";
import { AccountSecurityForm } from "@/components/dashboard/AccountSecurityForm";
import { User, Cpu, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface AuthDetails {
  id: string;
  email: string;
  providers: string[];
  hasGoogle: boolean;
  hasPassword: boolean;
  createdAt?: string;
}

interface SettingsViewProps {
  initialResume: string;
  uiLanguage?: string;
  outputLanguage: string;
  dailyLimit: number;
  hasBYOK: boolean;
  configuredProviders: string[];
  authDetails?: AuthDetails | null;
}

export function SettingsView({
  initialResume,
  uiLanguage,
  outputLanguage,
  dailyLimit,
  hasBYOK,
  configuredProviders,
  authDetails,
}: SettingsViewProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"general" | "security" | "advanced">(
    tabParam === "advanced" ? "advanced" : tabParam === "security" ? "security" : "general"
  );

  useEffect(() => {
    if (tabParam === "advanced") {
      setActiveTab("advanced");
    } else if (tabParam === "security") {
      setActiveTab("security");
    }
  }, [tabParam]);

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "bg-amethyst-glow/15 text-purple-200 border border-amethyst-glow/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amethyst-glow" />
          <span>{t.settings.securityTab || "Seguridad & Acceso"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("advanced")}
          className={`flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "advanced"
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>{t.settings.advancedTab || "Avanzado & API Keys (BYOK)"}</span>
          {configuredProviders.length > 0 && (
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
            <PreferencesForm initialUiLanguage={uiLanguage} initialOutputLanguage={outputLanguage} />
          </div>
        </div>
      ) : activeTab === "security" ? (
        <div className="max-w-3xl animate-in fade-in duration-200">
          <AccountSecurityForm authDetails={authDetails} />
        </div>
      ) : (
        <div className="max-w-4xl animate-in fade-in duration-200">
          <AdvancedBYOKForm initialConfiguredProviders={configuredProviders} />
        </div>
      )}
    </div>
  );
}
