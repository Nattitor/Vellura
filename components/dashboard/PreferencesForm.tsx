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
import { CheckCircle2, Languages, Moon } from "lucide-react";
import { toast } from "sonner";

export function PreferencesForm() {
  const [uiLanguage, setUiLanguage] = useState("English");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [isPending, setIsPending] = useState(false);

  const handleSave = () => {
    setIsPending(true);
    // Since we are mocking language preferences for now (not saved in DB schema),
    // we'll just simulate a save delay and show a toast.
    setTimeout(() => {
      setIsPending(false);
      toast.success("Preferences saved successfully");
    }, 800);
  };

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-8">
      
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-semibold text-white">App Preferences</h2>
        <p className="text-sm text-zinc-400">
          Customize your experience in Vellura.
        </p>
      </div>

      <div className="space-y-6">
        {/* UI Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center">
              <Languages className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-white font-medium">UI Language</p>
              <p className="text-sm text-zinc-500">The language of the dashboard interface.</p>
            </div>
          </div>
          <Select value={uiLanguage} onValueChange={setUiLanguage}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-white/10 text-white focus:ring-amethyst-glow">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white">
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish (Español)</SelectItem>
              <SelectItem value="French">French (Français)</SelectItem>
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
              <p className="text-white font-medium">AI Output Language</p>
              <p className="text-sm text-zinc-500">Default language for generated cover letters.</p>
            </div>
          </div>
          <Select value={outputLanguage} onValueChange={setOutputLanguage}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-white/10 text-white focus:ring-amethyst-glow">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white">
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
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
              <p className="text-white font-medium">Theme</p>
              <p className="text-sm text-zinc-500">Vellura is strictly designed for Dark Mode.</p>
            </div>
          </div>
          <Button disabled variant="outline" className="bg-zinc-900/50 border-white/10 text-zinc-400 w-[180px] justify-start opacity-70">
            Dark Mode (Enforced)
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-amethyst-glow hover:bg-amethyst-glow/90 text-white active:scale-[0.98] transition-transform min-w-[120px]"
        >
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

    </div>
  );
}
