"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Globe,
  Languages,
  Camera,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Key,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  Zap,
  Maximize2,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useAvatar } from "@/components/providers/avatar-provider";
import { dictionaries, LanguageType, languageLabels } from "@/utils/i18n/dictionaries";
import { AI_PROVIDERS, AIProviderId } from "@/utils/ai-models";
import { updateProfile, updateResume, updateAvatar, updateProviderKey } from "@/app/actions/profile";
import { toast } from "sonner";

interface OnboardingWizardProps {
  initialResume?: string;
  initialOutputLang?: string;
  userEmail?: string;
  googleAvatarUrl?: string | null;
  hasCompletedOnboarding?: boolean;
}

export function OnboardingWizard({
  initialResume = "",
  initialOutputLang = "Spanish",
  userEmail = "",
  googleAvatarUrl = null,
  hasCompletedOnboarding = false,
}: OnboardingWizardProps) {
  const { language, setLanguage, outputLanguage, setOutputLanguage, t } = useLanguage();
  const { avatarUrl, uploadAvatar } = useAvatar();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();

  // Step 1: Language preferences
  const [uiLang, setUiLang] = useState<LanguageType>(language);
  const [outLang, setOutLang] = useState<string>(outputLanguage || initialOutputLang || "Spanish");

  // Step 2: Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl || googleAvatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Resume
  const [resumeText, setResumeText] = useState(initialResume);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Step 4: BYOK
  const [byokProvider, setByokProvider] = useState<AIProviderId>("openrouter");
  const [byokKey, setByokKey] = useState("");

  // Instant reactive dictionary for current selected UI language
  const dict = dictionaries[uiLang] || t;

  // Word and Char counters for Master Resume
  const resumeWordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;
  const resumeCharCount = resumeText.length;

  // Determine if onboarding should show automatically or via custom event
  useEffect(() => {
    const localCompleted = localStorage.getItem(`vellura_onboarding_${userEmail}`);
    if (!localCompleted && !hasCompletedOnboarding && (!initialResume || initialResume.trim() === "")) {
      setIsOpen(true);
    }

    const handleOpen = () => {
      setStep(1);
      setIsOpen(true);
    };
    window.addEventListener("open-onboarding-wizard", handleOpen);
    return () => window.removeEventListener("open-onboarding-wizard", handleOpen);
  }, [userEmail, hasCompletedOnboarding, initialResume]);

  // Sync languages when changed in Step 1
  const handleUiLanguageChange = (val: string | null) => {
    if (!val) return;
    const newLang = val as LanguageType;
    setUiLang(newLang);
    setLanguage(newLang);
    setOutLang(newLang);
    setOutputLanguage(newLang);
  };

  const handleOutputLanguageChange = (val: string | null) => {
    if (!val) return;
    setOutLang(val);
    setOutputLanguage(val);
  };

  // Avatar file handling
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(dict.settings?.invalidImage || "Invalid image file");
        return;
      }
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  // Resume upload & fast multi-model parsing in Step 3
  const handleCVUpload = async (file: File) => {
    if (!file) return;

    setIsParsingCV(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("autoTranslate", autoTranslate ? "true" : "false");
    formData.append("targetLanguage", uiLang || "Spanish");

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error parsing resume");
      }

      const data = await response.json();
      if (data.resumeText) {
        setResumeText(data.resumeText);
        toast.success(dict.settings?.cvUploaded || "CV processed successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process resume");
    } finally {
      setIsParsingCV(false);
    }
  };

  // Finalize & Save All
  const handleComplete = async () => {
    startTransition(async () => {
      try {
        // 1. Save profile preferences & resume
        const profileRes = await updateProfile({
          ui_language: uiLang,
          output_language: outLang,
          resume_text: resumeText,
        });

        if (profileRes?.error) {
          throw new Error(profileRes.error);
        }

        // 2. Save avatar if custom file selected or keep google avatar
        if (avatarFile) {
          const success = await uploadAvatar(avatarFile);
          if (!success) {
            console.warn("Avatar upload notice: failed to upload avatar");
          }
        } else if (avatarPreview && avatarPreview === googleAvatarUrl) {
          const avatarRes = await updateAvatar(googleAvatarUrl);
          if (avatarRes?.error) {
            console.warn("Avatar sync notice:", avatarRes.error);
          }
        }

        // 3. Save BYOK key if provided
        if (byokKey.trim()) {
          const byokRes = await updateProviderKey(byokProvider, byokKey.trim());
          if (byokRes?.error) {
            throw new Error(byokRes.error);
          }
        }

        // 4. Mark local completion ONLY on verified success
        localStorage.setItem(`vellura_onboarding_${userEmail}`, "true");
        setIsOpen(false);
        toast.success(dict.onboarding?.savedSuccess || "Welcome to Vellura! Your workspace is ready.");
      } catch (err: any) {
        toast.error(err.message || "Error finalizing onboarding");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
        {/* Glow backdrop behind modal */}
        <div className="absolute w-[500px] h-[500px] bg-amethyst-glow/15 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full sm:max-w-2xl max-h-[90dvh] bg-zinc-950/95 border border-white/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white z-10"
        >
          {/* Top glowing hairline */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amethyst-glow via-cyan-400 to-amethyst-glow z-20" />

          {/* Modal Header */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amethyst-glow/15 border border-amethyst-glow/30 text-violet-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {dict.onboarding?.modalBadge || "Guía de Inicio Rápido"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-400">
                {dict.onboarding?.stepCounter?.replace("{current}", step.toString()).replace("{total}", "4") || `Paso ${step} de 4`}
              </span>
              <button
                onClick={() => {
                  localStorage.setItem(`vellura_onboarding_${userEmail}`, "true");
                  setIsOpen(false);
                }}
                className="touch-target text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multi-Step Progress Line */}
          <div className="w-full bg-zinc-900 h-1 shrink-0">
            <motion.div
              className="h-full bg-gradient-to-r from-amethyst-glow to-cyan-400"
              initial={{ width: "25%" }}
              animate={{ width: `${step * 25}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Modal Content Body (scrolls internally; footer is fixed below) */}
          <div className="p-4 sm:p-8 flex-1 min-h-0 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              {/* STEP 1: Welcome & Languages */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      👋 {dict.onboarding?.step1Title || "Bienvenida e Idiomas"}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {dict.onboarding?.step1Desc || "Elige tu idioma preferido para la interfaz y el idioma predeterminado para las cartas generadas."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* UI Language */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                          {dict.settings?.uiLang || "Idioma de la Interfaz"}
                        </span>
                      </div>
                      <Select value={uiLang} onValueChange={handleUiLanguageChange}>
                        <SelectTrigger className="w-full h-12 bg-zinc-950 border-white/10 text-white font-medium text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white z-[60]">
                          <SelectItem value="Spanish">🇪🇸 Español</SelectItem>
                          <SelectItem value="English">🇺🇸 English</SelectItem>
                          <SelectItem value="French">🇫🇷 Français</SelectItem>
                          <SelectItem value="Portuguese">🇧🇷 Português</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* AI Output Language */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-amethyst-glow" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                          {dict.settings?.outputLang || "Idioma de salida de IA"}
                        </span>
                      </div>
                      <Select value={outLang} onValueChange={handleOutputLanguageChange}>
                        <SelectTrigger className="w-full h-12 bg-zinc-950 border-white/10 text-white font-medium text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white z-[60]">
                          <SelectItem value="Spanish">🇪🇸 {languageLabels[uiLang]?.Spanish || "Español"}</SelectItem>
                          <SelectItem value="English">🇺🇸 {languageLabels[uiLang]?.English || "English"}</SelectItem>
                          <SelectItem value="French">🇫🇷 {languageLabels[uiLang]?.French || "Français"}</SelectItem>
                          <SelectItem value="Portuguese">🇧🇷 {languageLabels[uiLang]?.Portuguese || "Português"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Profile Picture / Google Avatar */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      📸 {dict.onboarding?.step2Title || "Foto de Perfil"}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {dict.onboarding?.step2Desc || "Configura tu foto de perfil profesional o mantén la foto de tu cuenta conectada."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-zinc-900/60 border border-white/10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amethyst-glow/50 bg-zinc-950 shadow-[0_0_25px_rgba(139,92,246,0.3)] flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-2xl font-bold text-zinc-500 uppercase">
                            {userEmail.slice(0, 2) || "U"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3 w-full sm:w-auto">
                      {googleAvatarUrl && avatarPreview === googleAvatarUrl && (
                        <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{dict.onboarding?.step2GoogleFound || "Foto de cuenta de Google detectada"}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarFile}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-white/10 cursor-pointer h-11 px-4 inline-flex items-center"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1.5 text-amethyst-glow" />
                          {dict.onboarding?.step2UploadNew || "Subir Nueva Foto"}
                        </Button>
                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setAvatarPreview(null);
                              setAvatarFile(null);
                            }}
                            className="text-zinc-400 hover:text-red-400 text-xs cursor-pointer"
                          >
                            {dict.nav?.removeAvatar || "Eliminar foto"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Master Resume with Auto-Translate Checkbox & Expand Mode */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      📄 {dict.onboarding?.step3Title || "Currículum Maestro"}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {dict.onboarding?.step3Desc || "Sube tu currículum (PDF, Word, TXT) o pégalo abajo. La IA estructurará tu experiencia."}
                    </p>
                  </div>

                  {/* Auto-Translate Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white select-none transition-colors bg-zinc-900/80 border border-white/10 px-3 h-11 rounded-lg">
                      <input
                        type="checkbox"
                        checked={autoTranslate}
                        onChange={(e) => setAutoTranslate(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-zinc-800 text-amethyst-glow focus:ring-amethyst-glow/50 accent-amethyst-glow cursor-pointer"
                      />
                      <span>
                        {dict.settings?.autoTranslateLabel || "Traducir automáticamente a"}{" "}
                        <strong className="text-cyan-400 font-semibold">{languageLabels[uiLang]?.[uiLang] || uiLang}</strong>
                      </span>
                    </label>
                  </div>

                  {/* Hidden CV Input */}
                  <input
                    type="file"
                    ref={cvInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCVUpload(f);
                    }}
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                  />

                  {/* Drag & Drop Box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleCVUpload(f);
                    }}
                    onClick={() => cvInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-cyan-400 bg-cyan-950/30"
                        : "border-white/15 bg-zinc-900/40 hover:border-amethyst-glow/50 hover:bg-zinc-900/70"
                    }`}
                  >
                    {isParsingCV ? (
                      <div className="flex items-center gap-2 py-1 text-amethyst-glow">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span className="text-xs font-semibold">{dict.settings?.parsingCV || "Extrayendo información con IA..."}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amethyst-glow/15 flex items-center justify-center">
                          <UploadCloud className="w-4 h-4 text-amethyst-glow" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-medium text-white">{dict.onboarding?.step3Drop || "Arrastra y suelta tu CV aquí (PDF, Word, TXT)"}</p>
                          <p className="text-[10px] text-zinc-400">{dict.settings?.uploadCV || "Haz clic para buscar en tus archivos"}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Textarea Header Bar with Word Count and Expand Button */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      {dict.settings?.masterResume || "Contenido del Currículum Maestro"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExpandedModalOpen(true)}
                      className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/5 transition-all cursor-pointer"
                      title="Expandir editor"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[11px] font-medium">{dict.workspace?.expand || "Expandir"}</span>
                    </button>
                  </div>

                  {/* Manual Edit Textarea */}
                  <Textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder={dict.onboarding?.step3OrPaste || "O escribe / pega tu experiencia manualmente..."}
                    className="h-[110px] bg-zinc-950/70 border-white/10 text-white font-mono text-base sm:text-xs leading-relaxed resize-none ethereal-scrollbar"
                  />

                  {/* Word / Char Counter */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
                    <span>{resumeWordCount} {resumeWordCount === 1 ? (dict.workspace?.word || "palabra") : (dict.workspace?.words || "palabras")}</span>
                    <span>{resumeCharCount} {resumeCharCount === 1 ? (dict.workspace?.character || "carácter") : (dict.workspace?.characters || "caracteres")}</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Frontier AI & BYOK */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      ⚡ {dict.onboarding?.step4Title || "Modelos de Frontera y BYOK"}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {dict.onboarding?.step4Desc || "Vellura incluye 5 generaciones diarias gratuitas. Conecta tus claves personales para generaciones 100% ilimitadas."}
                    </p>
                  </div>

                  {/* Dual Comparison Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Plan Gratuito</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        5 solicitudes diarias con <strong>Nemotron 3.5 Lightning</strong> y <strong>Nemotron 3 Ultra</strong> sin costo alguno.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amethyst-glow/10 border border-amethyst-glow/30 space-y-1.5 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                        <Shield className="w-3.5 h-3.5 text-amethyst-glow" />
                        <span>{dict.onboarding?.step4UnlimitedBadge || "Generaciones 100% Ilimitadas"}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Genera cartas <strong>ilimitadas</strong> con OpenRouter, Gemini, OpenAI, Claude o DeepSeek.
                      </p>
                    </div>
                  </div>

                  {/* Optional Key Input */}
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amethyst-glow" />
                        {dict.onboarding?.step4ConnectNow || "Conectar una clave ahora (Opcional)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Select value={byokProvider} onValueChange={(v) => { if (v) setByokProvider(v as AIProviderId); }}>
                        <SelectTrigger className="sm:col-span-1 h-9 bg-zinc-950 border-white/10 text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white z-[60]">
                          <SelectItem value="openrouter">OpenRouter</SelectItem>
                          <SelectItem value="google">Google Gemini</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Claude</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="password"
                        value={byokKey}
                        onChange={(e) => setByokKey(e.target.value)}
                        placeholder={dict.onboarding?.step4KeyPlaceholder || "Pega tu clave de API..."}
                        className="sm:col-span-2 h-12 sm:h-9 bg-zinc-950 border-white/10 text-base sm:text-xs text-white"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Modal Bottom Action Controls (fixed footer — always visible) */}
          <div className="shrink-0 px-4 sm:px-8 py-3 border-t border-white/5 bg-zinc-950/95 pb-safe">
            <div className="flex items-center justify-between gap-3">
              <div>
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="h-11 px-3 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    {dict.onboarding?.btnBack || "Atrás"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      localStorage.setItem(`vellura_onboarding_${userEmail}`, "true");
                      setIsOpen(false);
                    }}
                    className="h-11 px-3 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {dict.onboarding?.btnSkip || "Omitir por ahora"}
                  </Button>
                )}
              </div>

              <div>
                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as any)}
                    className="bg-amethyst-glow hover:bg-amethyst-glow/90 text-white text-xs px-5 h-11 shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer"
                  >
                    <span>{dict.onboarding?.btnNext || "Continuar"}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isPending}
                    className="bg-gradient-to-r from-amethyst-glow to-cyan-500 hover:opacity-90 text-white text-xs px-4 sm:px-6 h-11 font-semibold shadow-[0_0_20px_rgba(139,92,246,0.4)] cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1.5" />
                    )}
                    <span>{dict.onboarding?.btnFinish || "¡Comenzar a Crear Cartas!"}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Full Cover Expanded Master Resume Editor (panel level, over body + footer) */}
            <AnimatePresence>
              {isExpandedModalOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-30 bg-zinc-950 p-6 flex flex-col justify-between rounded-2xl border border-white/15 shadow-2xl"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-base font-bold text-white">{dict.settings?.masterResume || "Currículum Maestro"}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-mono">
                        {resumeWordCount} {resumeWordCount === 1 ? (dict.workspace?.word || "palabra") : (dict.workspace?.words || "palabras")} • {resumeCharCount} {resumeCharCount === 1 ? (dict.workspace?.character || "carácter") : (dict.workspace?.characters || "caracteres")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsExpandedModalOpen(false)}
                        className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Large Textarea */}
                  <div className="flex-1 py-3 min-h-0 flex flex-col">
                    <Textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder={dict.onboarding?.step3OrPaste || "Pega o edita tu experiencia aquí..."}
                      className="w-full flex-1 min-h-[280px] sm:min-h-[320px] bg-zinc-900/80 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-xl text-base sm:text-sm p-4 leading-relaxed font-mono resize-none ethereal-scrollbar"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
                    <span className="text-[11px] text-zinc-400 hidden min-[420px]:block">
                      {dict.settings?.saveContext || "Los cambios se aplicarán automáticamente a tu Master Resume."}
                    </span>
                    <Button
                      type="button"
                      onClick={() => setIsExpandedModalOpen(false)}
                      className="bg-gradient-to-r from-amethyst-glow to-cyan-500 hover:opacity-90 text-white text-xs font-semibold px-5 h-11 w-full min-[420px]:w-auto rounded-xl cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    >
                      {dict.workspace?.done || "Listo"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
