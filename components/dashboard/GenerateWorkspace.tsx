"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Copy, 
  Check, 
  Download,
  Sparkles, 
  Loader2, 
  Zap, 
  Search, 
  Brain, 
  PenTool, 
  MessageSquare, 
  Gauge, 
  Wand2, 
  FileText, 
  Sliders, 
  Cpu, 
  Maximize2,
  Info,
  ChevronRight,
  KeyRound,
  Key,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";
import { useQuota } from "@/components/providers/quota-provider";
import { AI_MODELS, AIProviderId, DEFAULT_SPEED_MODEL, AI_PROVIDERS } from "@/utils/ai-models";
import { ModelSelectionDrawer } from "@/components/dashboard/ModelSelectionDrawer";
import { stripMetadataComments, extractCompanyAndRole } from "@/utils/extract-company";

export function GenerateWorkspace({
  configuredProviders = [],
}: {
  configuredProviders?: string[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const { dailyLimit, decrementLimit } = useQuota();
  const [tone, setTone] = useState("professional");
  const [modelPref, setModelPref] = useState<"speed" | "reasoning">("speed");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Expert Mode State
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [expertProvider, setExpertProvider] = useState<AIProviderId>("google");
  const [expertModel, setExpertModel] = useState<string>("gemini-3.1-pro-preview");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [customDirectives, setCustomDirectives] = useState<string>("");

  const outputRef = useRef<HTMLDivElement>(null);

  const toneLabels: Record<string, string> = {
    professional: t.workspace.toneProfessional,
    confident: t.workspace.toneConfident,
    enthusiastic: t.workspace.toneEnthusiastic,
    executive: t.workspace.toneExecutive,
  };

  const parseErrorInCompletion = (text: string | null | undefined): string | null => {
    if (!text) return null;
    const trimmed = text.trim();
    if (
      trimmed.startsWith('{"type":"error"') ||
      trimmed.startsWith('{"error"') ||
      trimmed.includes('"insufficient_quota"') ||
      trimmed.includes('"invalid_api_key"') ||
      trimmed.includes('"model_not_found"')
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.error?.message || parsed.message || parsed.error || "Error de cuota o clave API en el proveedor.";
      } catch {
        if (trimmed.includes("insufficient_quota")) {
          return "Tu cuenta del proveedor de IA ha excedido su cuota o saldo disponible (insufficient_quota). Por favor verifica tu saldo en la consola del proveedor o cambia de modelo.";
        }
        return "Error al generar con la clave API del proveedor.";
      }
    }
    return null;
  };

  // A generation is strictly using BYOK (unlimited) ONLY when in Expert Mode with the corresponding key connected
  const isUsingOwnKey = isExpertMode && configuredProviders.includes(expertProvider);

  const {
    completion,
    complete,
    isLoading,
    error,
  } = useCompletion({
    api: "/api/generate",
    body: { 
      tone: toneLabels[tone] || tone, 
      modelPreference: isExpertMode ? "expert" : modelPref,
      expertModelId: isExpertMode ? expertModel : undefined,
      expertProviderId: isExpertMode ? expertProvider : undefined,
      temperature,
      customDirectives: isExpertMode ? customDirectives : undefined,
    },
    streamProtocol: "text",
    onFinish: (_prompt, comp) => {
      const cleanComp = comp ? comp.replace(/<!--[\s\S]*?-->/g, "").trim() : "";
      if (!cleanComp || cleanComp.length < 150) {
        const errorMsg = isUsingOwnKey
          ? (t.workspace.byokQuotaErrorDesc || "El proveedor de IA no devolvió contenido suficiente o canceló la generación (posible falta de saldo o cuota en tu clave API).")
          : (t.workspace.serverOverloadDesc || "La generación se interrumpió o los servidores de IA están sobrecargados. Tus intentos diarios gratuitos no fueron descontados.");
        setApiError(errorMsg);
        toast.error(errorMsg, { duration: 10000 });
        return;
      }
      const err = parseErrorInCompletion(comp);
      if (err) {
        setApiError(err);
        toast.error(err, { duration: 10000 });
        return;
      }
      setApiError(null);
      if (!isUsingOwnKey) {
        decrementLimit();
      }
      toast.success(t.workspace.generatedSuccess || "Document generated successfully!");
    },
    onError: (err) => {
      const msg = err.message || (isUsingOwnKey ? t.workspace.byokErrorWarning : t.workspace.serverOverloadDesc) || "Failed to generate document.";
      setApiError(msg);
      toast.error(msg, {
        duration: 10000,
      });
    }
  });

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error(t.workspace.emptyWarning || "Please paste a job description first.");
      return;
    }
    
    if (!isUsingOwnKey && dailyLimit <= 0) {
      toast.error(t.workspace.limitReached || "You've reached your daily limit!");
      return;
    }

    setApiError(null);
    
    // Smooth scroll to output on mobile
    if (window.innerWidth < 1024 && outputRef.current) {
      const y = outputRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    try {
      await complete(jobDescription);
    } catch (e: any) {
      // Caught by onError, but also fallback record error message
      if (e?.message) {
        setApiError(e.message);
      }
    }
  };

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((s) => (s + 1) % 3);
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [isLoading]);

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleCopy = () => {
    if (!completion || activeError) return;
    const cleanContent = completion.replace(/<!--[\s\S]*?-->/g, "").trim();
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!cleanCompletion) return;
    try {
      setIsDownloadingPDF(true);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      let plainText = cleanCompletion
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/#{1,6}\s?/g, "")
        .trim();

      doc.setFont("times", "normal");
      doc.setFontSize(11);

      const margin = 20;
      const pdfWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pdfWidth - margin * 2;

      const lines = doc.splitTextToSize(plainText, maxLineWidth);

      let y = 20;
      const lineHeight = 7;

      for (let i = 0; i < lines.length; i++) {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines[i], margin, y);
        y += lineHeight;
      }

      const cleanTarget = (detectedTarget || "cover-letter")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 35);

      doc.save(`vellura-${cleanTarget}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleApplyDrawerSettings = (params: {
    modelId: string;
    providerId: AIProviderId;
    temperature: number;
    customDirectives: string;
    isExpert: boolean;
  }) => {
    setExpertModel(params.modelId);
    setExpertProvider(params.providerId);
    setTemperature(params.temperature);
    setCustomDirectives(params.customDirectives);
    setIsExpertMode(params.isExpert);
    if (!params.isExpert) {
      setModelPref("speed");
    }
    setApiError(null);
    setIsDrawerOpen(false);
    toast.success(params.isExpert ? "Modelo y parámetros actualizados" : "Modo estándar activado");
  };

  const selectedModelObj = AI_MODELS.find((m) => m.id === expertModel);
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;
  const charCount = jobDescription.length;
  const detectedStreamError = parseErrorInCompletion(completion);
  const activeError = apiError || detectedStreamError;
  const cleanCompletion = stripMetadataComments(completion);

  const generatedWordCount = useMemo(() => {
    if (!cleanCompletion) return 0;
    return cleanCompletion.split(/\s+/).filter(Boolean).length;
  }, [cleanCompletion]);

  const detectedTarget = useMemo(() => {
    if (!cleanCompletion && !jobDescription) return "";
    return extractCompanyAndRole(jobDescription, completion);
  }, [jobDescription, completion, cleanCompletion]);

  const activeModelDisplayName = useMemo(() => {
    if (isExpertMode) {
      const found = AI_MODELS.find((m) => m.id === expertModel);
      return found ? found.name : expertModel;
    }
    return modelPref === "speed" ? "Nemotron 3.5 Lightning" : "Nemotron 3 Ultra 550B";
  }, [isExpertMode, expertModel, modelPref]);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch gap-6 lg:h-[calc(100vh-7.5rem)] lg:min-h-[640px]">
      
      {/* Left Column: Input Form (Full Height Symmetrical Flexbox) */}
      <div className="w-full lg:w-1/3 flex flex-col h-full min-h-0">
        <div className="ethereal-panel p-6 rounded-xl flex flex-col h-full min-h-0">
          
          {/* Header with (i) Tooltip & Drawer Trigger */}
          <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white tracking-tight">{t.workspace.jobContext}</h2>
              
              {/* Sleek (i) Info Tooltip Hover */}
              <div className="relative group/tooltip">
                <button
                  type="button"
                  aria-label="Información de contexto"
                  className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-help"
                >
                  <Info className="w-3 h-3" />
                </button>
                <div className="absolute left-0 top-full mt-2 hidden group-hover/tooltip:block w-64 p-2.5 bg-zinc-950/95 border border-white/15 rounded-xl text-[11px] text-zinc-300 shadow-2xl z-50 backdrop-blur-md leading-relaxed animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                  {t.workspace.jobContextDesc}
                </div>
              </div>
            </div>

            {/* Expert Mode Drawer Trigger Pill */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isExpertMode
                  ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{isExpertMode ? "Modo Experto (BYOK)" : t.workspace.expertMode}</span>
            </button>
          </div>

          {/* Form Middle Section */}
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            
            {/* Tone Selector */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amethyst-glow" />
                {t.workspace.toneLabel}
              </label>
              <Select value={tone} onValueChange={(val) => val && setTone(val)}>
                <SelectTrigger className="w-full h-10 bg-zinc-900/50 border-white/10 text-white text-sm focus:ring-amethyst-glow transition-all">
                  <SelectValue placeholder={t.workspace.toneSelectPlaceholder}>
                    {toneLabels[tone] || t.workspace.toneProfessional}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white z-[100]">
                  <SelectItem value="professional" className="text-sm">{t.workspace.toneProfessional}</SelectItem>
                  <SelectItem value="confident" className="text-sm">{t.workspace.toneConfident}</SelectItem>
                  <SelectItem value="enthusiastic" className="text-sm">{t.workspace.toneEnthusiastic}</SelectItem>
                  <SelectItem value="executive" className="text-sm">{t.workspace.toneExecutive}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Model Selector / Drawer Trigger */}
            {!isExpertMode ? (
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    {t.workspace.modelLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer font-medium"
                  >
                    <span>{t.workspace.exploreCatalog || "Explorar catálogo"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <Select value={modelPref} onValueChange={(val: any) => setModelPref(val)}>
                  <SelectTrigger className="w-full h-10 bg-zinc-900/50 border-white/10 text-white text-sm focus:ring-cyan-500 transition-all">
                    <SelectValue placeholder="Select mode">
                      {modelPref === "speed" ? t.workspace.modelSpeedLabel : t.workspace.modelReasoningLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white z-[100]">
                    <SelectItem value="speed" className="text-sm">
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        <span>{t.workspace.modelSpeedLabel}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="reasoning" className="text-sm">
                      <div className="flex items-center gap-2 text-sm">
                        <Wand2 className="w-4 h-4 text-amethyst-glow" />
                        <span>{t.workspace.modelReasoningLabel}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* Expert Mode Model Card Pill (Click opens Google AI Studio style drawer) */
              <div className="space-y-1.5 shrink-0 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    {t.workspace.modelLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cambiar motor</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-full h-10 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 rounded-lg px-3.5 flex items-center justify-between text-white text-xs font-mono transition-all group/btn cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] shrink-0" />
                    <span className="truncate font-semibold text-cyan-200">{selectedModelObj?.name || expertModel}</span>
                    <span className="text-[10px] text-zinc-400 font-sans">({expertProvider})</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-sans shrink-0 group-hover/btn:bg-cyan-500/30 transition-colors">
                    T: {temperature}
                  </span>
                </button>
                <div className="flex items-center gap-1.5 pt-0.5 text-[11px] font-medium">
                  {isUsingOwnKey ? (
                    <span className="text-cyan-400/90 flex items-center gap-1">
                      <span>♾️</span>
                      <span>Generaciones ilimitadas con tu clave ({AI_PROVIDERS[expertProvider]?.name || expertProvider})</span>
                    </span>
                  ) : (
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>Plan Gratuito • Consume 1 intento diario</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Flex Job Description Textarea (Refined subtle glow + Custom Ethereal Scrollbar) */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  {t.workspace.jobDescriptionLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setIsExpandModalOpen(true)}
                  className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/5 transition-all cursor-pointer"
                  title="Expandir editor"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium">{t.workspace.expand}</span>
                </button>
              </div>

              {/* Textarea with subtle, non-intrusive focus style and custom scrollbar */}
              <div className="flex-1 flex flex-col min-h-0 relative">
                <Textarea
                  placeholder={t.workspace.placeholder}
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  className="w-full flex-1 min-h-0 resize-none bg-zinc-900/40 border-white/10 hover:border-white/15 focus:border-white/25 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white/15 rounded-xl text-xs sm:text-sm p-4 leading-relaxed font-sans ethereal-scrollbar transition-all shadow-none"
                />
              </div>

              {/* Word & Character Counter Bottom Bar */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 shrink-0 pt-1 font-mono px-1">
                <span>{wordCount} {wordCount === 1 ? (t.workspace.word || "palabra") : (t.workspace.words || "palabras")}</span>
                <span>{charCount} {charCount === 1 ? (t.workspace.character || "carácter") : (t.workspace.characters || "caracteres")}</span>
              </div>
            </div>

          </div>

          {/* Submit Button (Pinned Bottom) */}
          <div className="pt-4 shrink-0 border-t border-white/5 mt-2">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !jobDescription.trim()}
              className="w-full h-11 bg-gradient-to-r from-amethyst-glow to-cyan-500 hover:from-amethyst-glow/90 hover:to-cyan-500/90 text-white font-semibold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer rounded-xl active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t.workspace.analyzing}</span>
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>{t.workspace.btnGenerate}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Output Display (Full Height Matching Flexbox) */}
      <div 
        ref={outputRef}
        className="w-full lg:w-2/3 ethereal-panel rounded-xl flex flex-col h-full min-h-[450px] lg:min-h-0 relative overflow-hidden group"
      >
        {/* Subtle dynamic background glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-amethyst-glow/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amethyst-glow/10 transition-colors duration-1000" />
        
        {/* Glassmorphic Top Bar with Document Identity and Actions */}
        <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-zinc-950/85 backdrop-blur-md z-20 flex items-center justify-between border-b border-white/5 gap-3">
          {/* Left: Document Target & Metadata info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {cleanCompletion ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {detectedTarget || t.workspace.defaultDocTitle || "Executive Cover Letter"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hidden sm:inline-flex items-center shrink-0">
                  {generatedWordCount} {t.history?.docWordCount || "palabras"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amethyst-glow" />
                <span>{t.workspace.documentCanvas || "Executive Document Canvas"}</span>
              </div>
            )}
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {cleanCompletion && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isLoading || isDownloadingPDF}
                className="h-8 px-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border-white/10 text-xs font-medium rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Descargar PDF"
              >
                {isDownloadingPDF ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="hidden sm:inline">PDF</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              disabled={!cleanCompletion || isLoading || !!activeError}
              className={cn(
                "h-8 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm",
                copied 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
              )}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? t.workspace.copied : t.workspace.copy}</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Letter Content or Error State Card */}
        <ScrollArea className="flex-1 h-full max-w-none">
          {activeError ? (
            /* Premium Context-Aware Error Card */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-24 relative z-10 max-w-lg mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className={cn(
                "w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg transition-all",
                isUsingOwnKey
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                  : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
              )}>
                {isUsingOwnKey ? (
                  <KeyRound className="w-8 h-8 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-cyan-400" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  {isUsingOwnKey
                    ? (t.workspace.byokQuotaErrorTitle || "Error de Cuota o Clave API")
                    : (t.workspace.serverOverloadTitle || "Servidores de IA Temporariamente Saturados")}
                </h3>
                <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 border border-white/10 p-4 rounded-xl font-mono text-left whitespace-pre-wrap shadow-inner">
                  {activeError}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  {isUsingOwnKey
                    ? (t.workspace.byokQuotaErrorDesc || "Tu proveedor de IA rechazó la solicitud debido a saldo insuficiente en tu cuenta o modelo no disponible con tu clave.")
                    : (t.workspace.serverOverloadDesc || "El servicio de IA está experimentando una alta demanda momentánea. Tus intentos diarios gratuitos no fueron descontados.")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full max-w-md mx-auto">
                {isUsingOwnKey ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        setApiError(null);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{t.workspace.switchModelBtn || "Cambiar Modelo"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/settings?tab=advanced")}
                      className="w-full h-10 bg-zinc-900/80 hover:bg-zinc-800 border-white/10 hover:border-white/20 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.workspace.checkApiKeysBtn || "Revisar Claves API"}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => handleGenerate()}
                      className="w-full h-10 bg-amethyst-glow hover:bg-amethyst-glow/90 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.workspace.retryGenerationBtn || "Reintentar Generación"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setApiError(null);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full h-10 bg-zinc-900/80 hover:bg-zinc-800 border-white/10 hover:border-white/20 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.workspace.switchModelBtn || "Cambiar Modelo"}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : cleanCompletion ? (
            <div className="pt-16 sm:pt-20 px-3 sm:px-8 pb-16">
              {/* Executive Manuscript Paper Canvas */}
              <div className="max-w-2xl mx-auto bg-zinc-950/80 border border-white/10 rounded-2xl p-6 sm:p-12 shadow-[0_15px_50px_rgba(0,0,0,0.7)] backdrop-blur-md relative overflow-hidden group/sheet">
                {/* Subtle top ambient glowing hairline */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amethyst-glow/60 to-transparent" />
                
                {/* Document Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-semibold">
                      Executive Cover Letter
                    </span>
                    <h2 className="text-sm font-semibold text-white tracking-tight mt-0.5 truncate">
                      {detectedTarget || "Candidate Application"}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900/90 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3 h-3 text-amethyst-glow" />
                      <span>{activeModelDisplayName}</span>
                    </span>
                  </div>
                </div>

                {/* Letter Body with Refined Leading & Typography */}
                <div className="font-serif text-[15px] sm:text-[16px] leading-[1.95] text-zinc-200 tracking-normal space-y-5 selection:bg-amethyst-glow/30 selection:text-white prose prose-invert max-w-none prose-p:my-3.5 prose-p:leading-[1.95]">
                  <ReactMarkdown>{cleanCompletion}</ReactMarkdown>
                </div>

                {/* Document Footer Bar */}
                <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                    <span>Bespoke tailored with Vellura AI</span>
                  </div>
                  <div className="font-mono text-zinc-400">
                    {generatedWordCount} {t.history?.docWordCount || "palabras"} • ~{Math.max(1, Math.round(generatedWordCount / 160))} min read
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-28 relative z-10">
              <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border-t-2 border-amethyst-glow rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-cyan-400 rounded-full animate-spin-reverse"></div>
                {loadingStep === 0 && <Search className="w-8 h-8 text-amethyst-glow animate-pulse" />}
                {loadingStep === 1 && <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />}
                {loadingStep === 2 && <PenTool className="w-8 h-8 text-amethyst-glow animate-pulse" />}
              </div>
              <div className="h-8 overflow-hidden">
                <div className={`transition-transform duration-500 flex flex-col items-center justify-center text-zinc-300 font-medium`} style={{ transform: `translateY(-${loadingStep * 32}px)` }}>
                  <p className="h-8 flex items-center">{t.workspace.analyzing}</p>
                  <p className="h-8 flex items-center">{t.workspace.aligning}</p>
                  <p className="h-8 flex items-center">{t.workspace.drafting}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-28 relative z-10">
              <div className="relative group-hover:scale-110 transition-transform duration-700">
                <div className="absolute inset-0 bg-amethyst-glow/20 blur-xl rounded-full"></div>
                <div className="w-20 h-20 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-sm relative z-10 rotate-3 group-hover:rotate-6 transition-transform">
                  <Sparkles className="w-10 h-10 text-amethyst-glow" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{t.workspace.title}</h3>
                <p className="text-zinc-400 max-w-sm mx-auto text-sm">
                  {t.workspace.subtitle}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Slide-Over Drawer: Google AI Studio Style Model Selection */}
      <ModelSelectionDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        selectedModel={expertModel}
        selectedProvider={expertProvider}
        temperature={temperature}
        customDirectives={customDirectives}
        isExpertMode={isExpertMode}
        configuredProviders={configuredProviders}
        onApply={handleApplyDrawerSettings}
      />

      {/* Expanded Job Description Dialog */}
      <Dialog open={isExpandModalOpen} onOpenChange={setIsExpandModalOpen}>
        <DialogContent className="bg-zinc-950 border border-white/15 text-white sm:max-w-3xl md:max-w-4xl p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>{t.workspace.expandTitle}</span>
              </DialogTitle>
              <span className="text-xs text-zinc-500 font-mono pr-6">
                {wordCount} {wordCount === 1 ? (t.workspace.word || "palabra") : (t.workspace.words || "palabras")} • {charCount} {charCount === 1 ? (t.workspace.character || "carácter") : (t.workspace.characters || "caracteres")}
              </span>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              {t.workspace.expandDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={t.workspace.placeholder}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-[380px] md:h-[480px] bg-zinc-900/60 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white/15 focus:border-white/25 rounded-xl text-sm p-4 leading-relaxed font-sans resize-none ethereal-scrollbar"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-zinc-400">
              {t.workspace.expandDesc}
            </span>
            <Button
              type="button"
              onClick={() => setIsExpandModalOpen(false)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-5 py-2 rounded-xl cursor-pointer"
            >
              {t.workspace.done}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
