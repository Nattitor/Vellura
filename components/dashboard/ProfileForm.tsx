"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateResume } from "@/app/actions/profile";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Camera, Trash2, User, FileUp, Sparkles, Brain, Search, FileText, UploadCloud } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/components/providers/language-provider";
import { useAvatar } from "@/components/providers/avatar-provider";
import { languageLabels } from "@/utils/i18n/dictionaries";
import { toast } from "sonner";

export function ProfileForm({ 
  initialResume = "", 
  outputLanguage = "English" 
}: { 
  initialResume?: string; 
  outputLanguage?: string; 
}) {
  const { language, outputLanguage: contextOutputLang, t } = useLanguage();
  const pageLanguage = language || "Spanish";
  const localizedTargetLangName = languageLabels[language]?.[pageLanguage] || pageLanguage;

  const { avatarUrl, uploadAvatar, removeAvatar } = useAvatar();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState(initialResume);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightPulse, setHighlightPulse] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);

  // Rotating parsing step animation
  useEffect(() => {
    if (isParsing) {
      const interval = setInterval(() => {
        setParsingStep((s) => (s + 1) % 3);
      }, 2200);
      return () => clearInterval(interval);
    } else {
      setParsingStep(0);
    }
  }, [isParsing]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
      e.target.value = "";
    }
  };

  const handleCVUpload = async (file: File) => {
    if (!file) return;

    const allowedExtensions = [".pdf", ".docx", ".txt", ".md"];
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      toast.error(t.settings.cvError || "Please upload a PDF, Word (.docx), or Text (.txt) file.");
      return;
    }

    setIsParsing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("autoTranslate", autoTranslate ? "true" : "false");
    formData.append("targetLanguage", pageLanguage);

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || t.settings.cvError);
      }

      const data = await response.json();
      if (data.resumeText) {
        setResume(data.resumeText);
        setHighlightPulse(true);
        setTimeout(() => setHighlightPulse(false), 3000);
        if (data.warning) {
          toast.info(data.warning, { duration: 6000 });
        } else {
          toast.success(t.settings.cvUploaded || "CV subido y estructurado con éxito.");
        }
      }
    } catch (err: any) {
      console.error("Resume parsing error:", err);
      toast.error(err.message || t.settings.cvError || "Error al procesar el currículum");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCVUpload(file);
      e.target.value = "";
    }
  };

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
    <div className="w-full space-y-8">
      {/* Profile Photo Card */}
      <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-5">
          <input
            type="file"
            ref={avatarFileInputRef}
            onChange={handleAvatarFileChange}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
          />
          <div 
            onClick={() => avatarFileInputRef.current?.click()}
            className="relative group/avatar cursor-pointer rounded-full p-0.5 border border-white/10 hover:border-amethyst-glow/50 transition-all shadow-xl"
          >
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Profile Avatar" />
              ) : null}
              <AvatarFallback className="bg-zinc-900 text-xl font-semibold text-white">
                <User className="w-8 h-8 text-zinc-500" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white mb-0.5" />
              <span className="text-[10px] text-zinc-200 font-medium">{t.nav.changeAvatar}</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t.settings.profilePhoto}</h2>
            <p className="text-sm text-zinc-400 max-w-sm mt-0.5">
              {t.settings.profilePhotoDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={() => removeAvatar()}
              className="bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 text-xs px-3"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {t.nav.removeAvatar}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => avatarFileInputRef.current?.click()}
            className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-xs px-4 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5 text-amethyst-glow" />
            {t.settings.uploadPhoto}
          </Button>
        </div>
      </div>

      {/* Master Resume Card with Drag & Drop & AI CV Upload */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleCVUpload(file);
        }}
        className={`w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6 relative overflow-hidden transition-all duration-300 ${
          isDragging ? "ring-2 ring-cyan-400/80 bg-cyan-950/20" : ""
        } ${highlightPulse ? "ring-2 ring-amethyst-glow shadow-[0_0_30px_rgba(139,92,246,0.3)]" : ""}`}
      >
        {/* Hidden CV File Input */}
        <input
          type="file"
          ref={cvFileInputRef}
          onChange={handleCVFileChange}
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
        />

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-cyan-400 rounded-xl animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-cyan-400 animate-bounce" />
            </div>
            <p className="text-base font-semibold text-white">{t.settings.dragDropText}</p>
          </div>
        )}

        {/* Header with Title and "Upload CV" Button + AutoTranslate Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col space-y-1">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {t.settings.masterResume}
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl">
              {t.settings.masterResumeDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white select-none transition-colors bg-zinc-900/80 border border-white/10 px-3 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-zinc-800 text-amethyst-glow focus:ring-amethyst-glow/50 accent-amethyst-glow cursor-pointer"
              />
              <span>{t.settings.autoTranslateLabel} <strong className="text-cyan-400 font-semibold">{localizedTargetLangName}</strong></span>
            </label>

            <Button
              type="button"
              onClick={() => cvFileInputRef.current?.click()}
              disabled={isParsing || isPending}
              className="bg-gradient-to-r from-amethyst-glow to-cyan-500 hover:opacity-90 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow-[0_0_20px_rgba(139,92,246,0.25)] flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              <span>{isParsing ? t.settings.parsingCV : t.settings.uploadCV}</span>
            </Button>
          </div>
        </div>

        {/* Parsing Progress Overlay */}
        {isParsing && (
          <div className="w-full bg-zinc-900/90 backdrop-blur-md border border-amethyst-glow/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-amethyst-glow/10 via-cyan-400/10 to-amethyst-glow/10 animate-pulse pointer-events-none" />
            
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-amethyst-glow/40 border-t-amethyst-glow rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-2 border-cyan-400/40 border-r-cyan-400 rounded-full animate-spin-reverse"></div>
              {parsingStep === 0 && <Search className="w-6 h-6 text-amethyst-glow animate-pulse" />}
              {parsingStep === 1 && <Brain className="w-6 h-6 text-cyan-400 animate-pulse" />}
              {parsingStep === 2 && <FileText className="w-6 h-6 text-amethyst-glow animate-pulse" />}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {parsingStep === 0 && t.settings.stepReading}
                {parsingStep === 1 && t.settings.stepExtracting}
                {parsingStep === 2 && t.settings.stepFormatting}
              </p>
              <p className="text-xs text-zinc-400">
                Gemini Multimodal AI is organizing your experience into Master Context
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4 relative z-10">
          <Textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder={t.settings.masterResumePlaceholder}
            className="h-[420px] min-h-[420px] max-h-[420px] bg-zinc-900/50 border-white/10 text-white font-mono text-sm leading-relaxed focus-visible:ring-amethyst-glow resize-none overflow-y-auto ethereal-scrollbar"
            disabled={isPending || isParsing}
          />

          {status === "error" && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <div className="flex justify-end pt-4 relative z-10">
            <Button
              onClick={handleSave}
              disabled={isPending || isParsing || resume === initialResume}
              className="bg-amethyst-glow hover:bg-amethyst-glow/90 text-white active:scale-[0.98] transition-all min-w-[120px] shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : status === "success" ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
              ) : null}
              {status === "success" ? t.settings.saved : t.settings.saveContext}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
