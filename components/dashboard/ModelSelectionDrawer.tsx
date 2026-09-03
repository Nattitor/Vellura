"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Check, 
  Sparkles, 
  Cpu, 
  Sliders, 
  Zap, 
  Brain, 
  Globe, 
  Layers,
  Settings2,
  Key,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { 
  AI_MODELS, 
  AI_PROVIDERS, 
  AIProviderId, 
  AIModelDefinition, 
  DEFAULT_SPEED_MODEL,
  getModelDescription 
} from "@/utils/ai-models";
import { useLanguage } from "@/components/providers/language-provider";

interface ModelSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModel: string;
  selectedProvider: AIProviderId;
  temperature: number;
  customDirectives: string;
  isExpertMode: boolean;
  configuredProviders?: string[];
  onApply: (params: {
    modelId: string;
    providerId: AIProviderId;
    temperature: number;
    customDirectives: string;
    isExpert: boolean;
  }) => void;
}

export function ModelSelectionDrawer({
  open,
  onOpenChange,
  selectedModel,
  selectedProvider,
  temperature: initialTemp,
  customDirectives: initialDirectives,
  isExpertMode,
  configuredProviders = [],
  onApply,
}: ModelSelectionDrawerProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"models" | "parameters">("models");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [currentProvider, setCurrentProvider] = useState<AIProviderId>(selectedProvider);
  const [temp, setTemp] = useState(initialTemp);
  const [directives, setDirectives] = useState(initialDirectives);
  const [showBYOKWarning, setShowBYOKWarning] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync state when opened
  const handleOpenState = (newOpen: boolean) => {
    if (newOpen) {
      setCurrentModel(selectedModel);
      setCurrentProvider(selectedProvider);
      setTemp(initialTemp);
      setDirectives(initialDirectives);
      setActiveTab("models");
      if (headerRef.current) headerRef.current.dataset.compact = "false";
    }
    onOpenChange(newOpen);
  };

  const filteredModels = useMemo(() => {
    return AI_MODELS.filter((m) => {
      // Filter by Provider
      if (activeFilter !== "all" && m.provider !== activeFilter) {
        return false;
      }
      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.badge && m.badge.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeFilter, searchQuery]);

  // Keep the active filter pill visible in the single-row swipe strip (mobile)
  useEffect(() => {
    const el = pillsRef.current?.querySelector('[data-active="true"]');
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
    }
  }, [activeFilter]);

  // Compact the header when the list scrolls (sentinel: fires once per crossing, no re-render)
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    header.dataset.compact = "false";
    const io = new IntersectionObserver(
      ([entry]) => {
        header.dataset.compact = entry.isIntersecting ? "false" : "true";
      },
      { root: scrollRef.current, rootMargin: "-24px 0px 0px 0px", threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [open]);

  const handleSelectModel = (model: AIModelDefinition) => {
    setCurrentModel(model.id);
    setCurrentProvider(model.provider);
  };

  const handleApplyClick = () => {
    const selectedObj = AI_MODELS.find((m) => m.id === currentModel);
    const requiresKey = selectedObj && !selectedObj.isFree;
    const hasKey = configuredProviders.includes(currentProvider);

    // If model requires BYOK and user has NOT configured this provider key yet
    if (requiresKey && !hasKey) {
      setShowBYOKWarning(true);
      return;
    }

    commitApply(currentModel, currentProvider, temp, directives, true);
  };

  const commitApply = (
    modelId: string,
    providerId: AIProviderId,
    tVal: number,
    dVal: string,
    expert: boolean
  ) => {
    onApply({
      modelId,
      providerId,
      temperature: tVal,
      customDirectives: dVal,
      isExpert: expert,
    });
    onOpenChange(false);
  };

  const handleResetToStandard = () => {
    commitApply(DEFAULT_SPEED_MODEL, "groq", 0.7, "", false);
  };

  const handleSelectFreeAndApply = () => {
    setShowBYOKWarning(false);
    commitApply(DEFAULT_SPEED_MODEL, "groq", 0.7, "", false);
  };

  const handleGoToSettings = () => {
    setShowBYOKWarning(false);
    onOpenChange(false);
    router.push("/dashboard/settings?tab=advanced");
  };

  const getProviderIcon = (provider: AIProviderId) => {
    switch (provider) {
      case "google":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case "openai":
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case "anthropic":
        return <Brain className="w-4 h-4 text-amber-400" />;
      case "deepseek":
        return <Zap className="w-4 h-4 text-blue-400" />;
      case "openrouter":
        return <Globe className="w-4 h-4 text-purple-400" />;
      case "groq":
        return <Zap className="w-4 h-4 text-orange-400" />;
      default:
        return <Cpu className="w-4 h-4 text-zinc-400" />;
    }
  };

  const providerList = Object.values(AI_PROVIDERS);
  const selectedModelObj = AI_MODELS.find((m) => m.id === currentModel);

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenState}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl bg-zinc-950/95 border-l border-white/15 p-0 flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-xl">
          
          {/* Header with Navigation Tabs (compacts on scroll: title/desc collapse, tabs+search stay) */}
          <div ref={headerRef} data-compact="false" className="group border-b border-white/10 shrink-0 p-4 sm:p-6 space-y-4 motion-safe:transition-all motion-safe:duration-200 group-data-[compact=true]:p-3 group-data-[compact=true]:space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="font-semibold text-white flex items-center gap-2.5 text-xl motion-safe:transition-all motion-safe:duration-200 group-data-[compact=true]:text-base">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <span>{t.workspace.expertModalTitle}</span>
                </SheetTitle>
                <div className="grid grid-rows-[1fr] opacity-100 motion-safe:transition-all motion-safe:duration-200 group-data-[compact=true]:grid-rows-[0fr] group-data-[compact=true]:opacity-0">
                  <div className="overflow-hidden">
                    <SheetDescription className="text-xs text-zinc-400">
                      {t.workspace.expertModalDesc}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Models vs Parameters) — full-width 2-col on phones */}
            <div className="grid grid-cols-2 items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("models")}
                className={`touch-target flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "models"
                    ? "bg-white text-zinc-950 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.workspace.drawerTabsModels || "Modelos de IA"} ({AI_MODELS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("parameters")}
                className={`touch-target flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "parameters"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{t.workspace.drawerTabsParams || "Parámetros & Ajustes"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 font-mono">
                  T: {temp}
                </span>
              </button>
            </div>

            {/* Search & Filter pills (Visible only on Models Tab) */}
            {activeTab === "models" && (
              <div className="space-y-2 sm:space-y-3 pt-1 animate-in fade-in duration-150">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={t.workspace.searchModelsPlaceholder || "Buscar modelo o capacidades..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900/90 border-white/10 text-white pl-10 h-12 text-base sm:text-xs rounded-xl focus-visible:ring-cyan-500 placeholder:text-zinc-500"
                  />
                </div>

                {/* Filter Pills (single swipe row on phones, wrapped grid on sm+) */}
                <div ref={pillsRef} className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    data-active={activeFilter === "all" ? "true" : undefined}
                    className={`inline-flex items-center min-h-[40px] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === "all"
                        ? "bg-white text-zinc-950 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                        : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {t.workspace.filterAll || "Todos"} ({AI_MODELS.length})
                  </button>

                  {providerList.map((p) => {
                    const count = AI_MODELS.filter((m) => m.provider === p.id).length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveFilter(p.id)}
                        data-active={activeFilter === p.id ? "true" : undefined}
                        className={`inline-flex items-center min-h-[40px] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all gap-1.5 cursor-pointer ${
                          activeFilter === p.id
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                            : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Middle Content Area (Constrained flex-1 with native smooth overflow scroll) */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            <div ref={sentinelRef} aria-hidden className="h-px w-full shrink-0" />
            {activeTab === "models" ? (
              /* TAB 1: MODEL CATALOG (Google AI Studio Cards) */
              <div className="space-y-3 pb-4">
                {/* Privacy & Zero-Retention Notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-zinc-300 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{t.workspace.freeModelPrivacyNotice}</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                {filteredModels.map((m) => {
                  const isSelected = currentModel === m.id;
                  const isBYOK = !m.isFree;
                  const hasKey = configuredProviders.includes(m.provider);

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? "bg-cyan-950/25 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30"
                          : "bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                              : "bg-zinc-800/80 border-white/10 text-zinc-400 group-hover:text-white"
                          }`}>
                            {getProviderIcon(m.provider)}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-semibold truncate ${
                                isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"
                              }`}>
                                {m.name}
                              </h4>

                              {/* Badge Color Logic */}
                              {m.badge && (
                                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                  isBYOK
                                    ? "bg-amber-950/80 border border-amber-500/40 text-amber-300"
                                    : "bg-cyan-950/80 border border-cyan-500/30 text-cyan-300"
                                }`}>
                                  {m.badge === "Free Tier" ? (t.workspace.freeTierBadge || "Free Tier") : m.badge}
                                </span>
                              )}

                              {/* Free Tier vs BYOK Badge */}
                              {m.isFree ? (
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                                  {t.workspace.freeTierBadge || "Free Tier"}
                                </span>
                              ) : (
                                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  hasKey 
                                    ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                                    : "bg-zinc-900 border-amber-500/30 text-amber-400/90"
                                }`}>
                                  <Key className="w-2.5 h-2.5" />
                                  <span>{hasKey ? (t.workspace.keyConnectedBadge || "Clave Conectada") : (t.workspace.keyRequiredBadge || "Requiere Clave")}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                              {getModelDescription(m.id, language)}
                            </p>

                            <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-500 font-mono min-w-0">
                              <span className="truncate">ID: {m.id}</span>
                              <span>•</span>
                              <span>{AI_PROVIDERS[m.provider]?.name || m.provider}</span>
                            </div>
                          </div>
                        </div>

                        {/* Selected Checkmark */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? "bg-cyan-500 border-cyan-400 text-zinc-950"
                            : "border-white/10 text-transparent"
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredModels.length === 0 && (
                  <div className="py-16 text-center space-y-2">
                    <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-sm text-zinc-400">
                      {t.workspace.noModelsFound || "No se encontraron modelos para tu búsqueda."}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                      className="text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      {t.workspace.filterAll || "Todos"}
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              /* TAB 2: ADVANCED GENERATION PARAMETERS */
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Currently Selected Model Summary Card */}
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {t.workspace.selectedModelTitle || "Modelo Seleccionado Actualmente"}
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                        {getProviderIcon(currentProvider)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white truncate">{selectedModelObj?.name || currentModel}</h4>
                        <p className="text-xs text-zinc-400 font-mono">{t.workspace.providerLabel || "Proveedor"}: {currentProvider}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("models")}
                      className="text-xs text-cyan-400 hover:underline cursor-pointer font-medium"
                    >
                      {t.workspace.switchModelBtn || "Cambiar modelo"}
                    </button>
                  </div>
                </div>

                {/* Creativity / Temperature Slider */}
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{t.workspace.creativity}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{t.workspace.creativityDesc || "Controla la aleatoriedad y variabilidad en la redacción."}</p>
                    </div>
                    <span className="text-base font-bold font-mono text-cyan-400 px-3 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded-lg">
                      {temp}
                    </span>
                  </div>

                  <div className="pt-2 space-y-2">
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer touch-target"
                    />
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-[11px] text-zinc-400 font-mono pt-1">
                      <span>{t.workspace.tempStructured || "0.2 (Estructurado & Analítico)"}</span>
                      <span>{t.workspace.tempRecommended || "0.7 (Recomendado)"}</span>
                      <span>{t.workspace.tempCreative || "1.0 (Creativo & Audaz)"}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Directives Textarea */}
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-white/10 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{t.workspace.customDirectives}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{t.workspace.directivesDesc || "Instrucciones persistentes que se inyectan en el prompt para guiar a la IA."}</p>
                  </div>

                  <Textarea
                    value={directives}
                    onChange={(e) => setDirectives(e.target.value)}
                    placeholder={t.workspace.customDirectivesPlaceholder}
                    className="bg-zinc-950/80 border-white/10 text-white font-mono text-base sm:text-xs leading-relaxed min-h-[120px] resize-none focus-visible:ring-cyan-500 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions (stacked full-width on phones) */}
          <div className="p-4 bg-zinc-950 border-t border-white/10 shrink-0 space-y-2.5 pb-safe">
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetToStandard}
                className="h-11 w-full sm:w-auto justify-center text-xs text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                {t.workspace.standardModePrompt}
              </Button>

              <Button
                type="button"
                onClick={handleApplyClick}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-6 h-12 w-full sm:w-auto justify-center rounded-xl font-semibold cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
              >
                {t.workspace.applyAndClose}
              </Button>
            </div>
            
            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              {t.workspace.byokUnlimitedDrawerHint || "✨ Al usar modelos BYOK con tus claves API, disfrutas de generaciones 100% ilimitadas sin consumir tu cuota diaria."}
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Premium BYOK Missing API Key Warning Modal */}
      <Dialog open={showBYOKWarning} onOpenChange={setShowBYOKWarning}>
        <DialogContent className="bg-zinc-950 border border-amber-500/40 text-white w-[calc(100vw-2rem)] sm:w-full sm:max-w-md max-h-[85dvh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <KeyRound className="w-7 h-7 text-amber-400" />
            </div>

            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 inline-block">
                {t.workspace.proModelRequiredBadge || "Modelo Pro / BYOK Requerido"}
              </span>
              <DialogTitle className="text-lg font-bold text-white">
                {t.workspace.apiKeyRequiredTitle || "Clave API Requerida"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-300 leading-relaxed pt-1">
                {selectedModelObj?.name || currentModel} ({AI_PROVIDERS[currentProvider]?.name || currentProvider}) - {t.workspace.byokErrorWarning || "Este modelo requiere que configures tu propia clave API."}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1.5 my-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.workspace.apiKeyRequiredNotice || "💡 Tus claves se guardan de forma encriptada y nunca se comparten."}
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={handleGoToSettings}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs h-12 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-98 transition-all"
            >
              <span>{t.workspace.goToSettingsBtn || "Ir a Ajustes para Añadir Clave"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSelectFreeAndApply}
              className="w-full border-white/10 hover:bg-white/5 text-zinc-300 text-xs h-11 rounded-xl cursor-pointer"
            >
              {t.workspace.useFreeModelBtn || "⚡ Usar Modelo Gratuito (Qwen3.8 27B)"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowBYOKWarning(false);
                commitApply(currentModel, currentProvider, temp, directives, true);
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 text-center py-1 transition-colors cursor-pointer"
            >
              {t.workspace.continueWithoutKeyBtn || "Continuar y configurar clave más tarde"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
