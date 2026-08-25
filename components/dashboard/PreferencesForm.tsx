"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages, Moon } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/profile";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageType } from "@/utils/i18n/dictionaries";

export function PreferencesForm({ initialOutputLanguage = "English" }: { initialOutputLanguage?: string }) {
  const { language, setLanguage, outputLanguage: contextOutputLang, setOutputLanguage: setContextOutputLang, t } = useLanguage();
  const [uiLanguage, setUiLanguage] = useState<LanguageType>(language);
  const [outputLanguage, setOutputLanguage] = useState(contextOutputLang || initialOutputLanguage);
  const [isPending, setIsPending] = useState(false);

  const handleSave = async () => {
    setIsPending(true);
    try {
      const { error } = await updateProfile({ 
        output_language: outputLanguage
      });
      if (error) {
        toast.error("Failed to save preferences.");
      } else {
        setLanguage(uiLanguage);
        setContextOutputLang(outputLanguage);
        toast.success("Preferences saved successfully");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-8 relative overflow-hidden">
      {/* Decorative background element for premium feel */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amethyst-glow/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col space-y-2 relative z-10">
        <h2 className="text-xl font-semibold text-white">{t.settings.appPref}</h2>
        <p className="text-sm text-zinc-400">
          {t.settings.appPrefDesc}
        </p>
      </div>

      <div className="space-y-6 relative z-10">
        {/* UI Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center">
              <Languages className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-white font-medium">{t.settings.uiLang}</p>
              <p className="text-sm text-zinc-500">{t.settings.uiLangDesc}</p>
            </div>
          </div>
          <Select value={uiLanguage} onValueChange={(val) => setUiLanguage(val as LanguageType)}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-white/10 text-white focus:ring-amethyst-glow transition-all">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white">
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish (Español)</SelectItem>
              <SelectItem value="French">French (Français)</SelectItem>
              <SelectItem value="Portuguese">Portuguese (PT-BR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI Output Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amethyst-glow/10 border border-amethyst-glow/20 flex items-center justify-center">
              <Languages className="w-5 h-5 text-amethyst-glow" />
            </div>
            <div>
              <p className="text-white font-medium">{t.settings.outputLang}</p>
              <p className="text-sm text-zinc-500">{t.settings.outputLangDesc}</p>
            </div>
          </div>
          <Select value={outputLanguage} onValueChange={(val) => val && setOutputLanguage(val)}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-white/10 text-white focus:ring-amethyst-glow transition-all">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white">
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="Portuguese">Portuguese (PT-BR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Theme (Strictly Dark Mode) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center">
              <Moon className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-white font-medium">{t.settings.theme}</p>
              <p className="text-sm text-zinc-500">{t.settings.themeDesc}</p>
            </div>
          </div>
          <Button disabled variant="outline" className="bg-zinc-900/50 border-white/10 text-zinc-400 w-[180px] justify-start opacity-70">
            Dark Mode (Enforced)
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4 relative z-10">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-amethyst-glow hover:bg-amethyst-glow/90 text-white active:scale-[0.98] transition-all min-w-[120px] shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
        >
          {isPending ? t.settings.saving : t.settings.savePref}
        </Button>
      </div>

    </div>
  );
}
