"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages, Moon, Globe, Sliders } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/profile";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageType } from "@/utils/i18n/dictionaries";

export function PreferencesForm({ 
  initialUiLanguage,
  initialOutputLanguage = "English" 
}: { 
  initialUiLanguage?: string;
  initialOutputLanguage?: string; 
}) {
  const { language, setLanguage, outputLanguage: contextOutputLang, setOutputLanguage: setContextOutputLang, t } = useLanguage();
  const [uiLanguage, setUiLanguage] = useState<LanguageType>((initialUiLanguage as LanguageType) || language);
  const [outputLanguage, setOutputLanguage] = useState(contextOutputLang || initialOutputLanguage);
  // Track whether the user has manually overridden output language; if not, sync with UI language.
  const [outputLanguageTouched, setOutputLanguageTouched] = useState(
    contextOutputLang !== undefined && contextOutputLang !== (initialUiLanguage as string)
  );
  const [isPending, setIsPending] = useState(false);

  // Keep output language in sync with UI language unless the user has manually picked a different one.
  useEffect(() => {
    if (!outputLanguageTouched) {
      setOutputLanguage(uiLanguage);
    }
  }, [uiLanguage, outputLanguageTouched]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      const { error } = await updateProfile({ 
        ui_language: uiLanguage,
        output_language: outputLanguage
      });
      if (error) {
        toast.error("Failed to save preferences.");
      } else {
        setLanguage(uiLanguage);
        setContextOutputLang(outputLanguage);
        toast.success(t.settings.saved || "Preferences saved successfully");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-2xl flex flex-col space-y-6 relative overflow-hidden shadow-2xl">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amethyst-glow/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col space-y-1 relative z-10">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-amethyst-glow" />
          <h2 className="text-base font-semibold text-white leading-tight">{t.settings.appPref}</h2>
        </div>
        <p className="text-xs text-zinc-400">
          {t.settings.appPrefDesc}
        </p>
      </div>

      <div className="space-y-5 relative z-10">
        {/* UI Language Section */}
        <div className="space-y-2 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-400 shrink-0" />
            <label className="text-xs font-semibold text-zinc-200">{t.settings.uiLang}</label>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {t.settings.uiLangDesc}
          </p>
          <div className="pt-1">
            <Select value={uiLanguage} onValueChange={(val) => setUiLanguage(val as LanguageType)}>
              <SelectTrigger className="w-full h-10 text-xs bg-zinc-900/80 border-white/10 hover:border-white/20 text-white rounded-xl focus:ring-1 focus:ring-amethyst-glow/50 transition-all shadow-sm">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950/95 border-white/15 text-white backdrop-blur-xl rounded-xl shadow-2xl">
                <SelectItem value="English" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇺🇸</span>
                    <span className="font-medium text-zinc-200">English</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">EN</span>
                  </div>
                </SelectItem>
                <SelectItem value="Spanish" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇪🇸</span>
                    <span className="font-medium text-zinc-200">Español</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">ES</span>
                  </div>
                </SelectItem>
                <SelectItem value="French" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇫🇷</span>
                    <span className="font-medium text-zinc-200">Français</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">FR</span>
                  </div>
                </SelectItem>
                <SelectItem value="Portuguese" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇧🇷</span>
                    <span className="font-medium text-zinc-200">Português</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">PT</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AI Output Language Section */}
        <div className="space-y-2 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amethyst-glow shrink-0" />
            <label className="text-xs font-semibold text-zinc-200">{t.settings.outputLang}</label>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {t.settings.outputLangDesc}
          </p>
          <div className="pt-1">
            <Select value={outputLanguage} onValueChange={(val) => val && setOutputLanguage(val)}>
              <SelectTrigger className="w-full h-10 text-xs bg-zinc-900/80 border-white/10 hover:border-white/20 text-white rounded-xl focus:ring-1 focus:ring-amethyst-glow/50 transition-all shadow-sm">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950/95 border-white/15 text-white backdrop-blur-xl rounded-xl shadow-2xl">
                <SelectItem value="English" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇺🇸</span>
                    <span className="font-medium text-zinc-200">English</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">EN</span>
                  </div>
                </SelectItem>
                <SelectItem value="Spanish" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇪🇸</span>
                    <span className="font-medium text-zinc-200">Español</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">ES</span>
                  </div>
                </SelectItem>
                <SelectItem value="French" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇫🇷</span>
                    <span className="font-medium text-zinc-200">Français</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">FR</span>
                  </div>
                </SelectItem>
                <SelectItem value="Portuguese" className="text-xs py-2.5 cursor-pointer">
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-sm">🇧🇷</span>
                    <span className="font-medium text-zinc-200">Português</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">PT</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Theme Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-zinc-400 shrink-0" />
            <label className="text-xs font-semibold text-zinc-200">{t.settings.theme}</label>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {t.settings.themeDesc}
          </p>
          <div className="pt-1">
            <div className="w-full h-10 bg-zinc-900/40 border border-white/5 rounded-xl px-3.5 flex items-center justify-between text-xs text-zinc-400 select-none">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🌙</span>
                <span className="font-medium text-zinc-300">Dark Mode</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                Enforced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2 relative z-10">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full bg-amethyst-glow hover:bg-amethyst-glow/90 text-white text-xs font-semibold h-10 rounded-xl active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(139,92,246,0.25)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] cursor-pointer"
        >
          {isPending ? (t.settings.saving || "Saving...") : (t.settings.savePref || "Save Preferences")}
        </Button>
      </div>

    </div>
  );
}
