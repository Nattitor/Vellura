"use client";

import { useState, useTransition } from "react";
import { updateResume } from "@/app/actions/profile";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ProfileForm({ initialResume }: { initialResume: string | null }) {
  const [resume, setResume] = useState(initialResume || "");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    setStatus("idle");
    setErrorMessage("");
    
    startTransition(async () => {
      const result = await updateResume(resume);
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  };

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-semibold text-white">Master Resume (Global Context)</h2>
        <p className="text-sm text-zinc-400">
          Paste your master resume here. This text will be silently injected into all AI prompts to personalize your cover letters and documents without you needing to upload it every time.
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        <Textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="e.g. John Doe - Full Stack Developer. Experience: 5 years at TechCorp..."
          className="min-h-[300px] bg-zinc-900/50 border-white/10 text-white font-mono text-sm leading-relaxed focus-visible:ring-amethyst-glow resize-y"
          disabled={isPending}
        />

        {status === "error" && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending || resume === initialResume}
            className="bg-amethyst-glow hover:bg-amethyst-glow/90 text-white active:scale-[0.98] transition-transform min-w-[120px]"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
            ) : null}
            {status === "success" ? "Saved!" : "Save Context"}
          </Button>
        </div>
      </div>
    </div>
  );
}
