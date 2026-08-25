"use client";

import { useState } from "react";
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
import { Copy, Check, Sparkles, Loader2, Zap, Search, Brain, PenTool, MessageSquare, Gauge, Wand2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";

export function GenerateWorkspace({ initialDailyLimit = 3 }: { initialDailyLimit?: number }) {
  const { t } = useLanguage();
  const [tone, setTone] = useState("Professional & Polished");
  const [modelPref, setModelPref] = useState("speed");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(initialDailyLimit);
  const [showProModal, setShowProModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const outputRef = useRef<HTMLDivElement>(null);

  const {
    completion,
    complete,
    isLoading,
    error,
  } = useCompletion({
    api: "/api/generate",
    body: { tone, modelPreference: modelPref },
    streamProtocol: "text",
    onFinish: () => {
      setDailyLimit((c) => Math.max(0, c - 1));
      toast.success("Document generated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate document.");
    }
  });

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }
    
    if (dailyLimit <= 0) {
      toast.error("You've reached your daily limit! Add a BYOK key in settings.");
      return;
    }
    
    // Smooth scroll to output on mobile
    if (window.innerWidth < 1024 && outputRef.current) {
      const y = outputRef.current.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    try {
      await complete(jobDescription);
    } catch (e) {
      // Error is handled by onError in useCompletion
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

  const handleCopy = () => {
    if (!completion) return;
    navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      
      {/* Left Column: Input Form */}
      <div className="w-full lg:w-1/3 flex flex-col space-y-4">
        <div className="ethereal-panel p-6 rounded-xl flex flex-col flex-1">
          <div className="space-y-1 mb-6">
            <h2 className="text-xl font-semibold text-white">{t.workspace.jobContext}</h2>
            <p className="text-sm text-zinc-400">
              {t.workspace.jobContextDesc}
            </p>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amethyst-glow" />
                  {t.workspace.toneLabel}
                </label>
                <Select value={tone} onValueChange={(val) => val && setTone(val)}>
                  <SelectTrigger className="w-full h-11 bg-zinc-900/50 border-white/10 text-white focus:ring-amethyst-glow transition-all">
                    <SelectValue placeholder="Select a tone">
                      {tone}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white z-[100]">
                    <SelectItem value="Professional & Polished">Professional & Polished</SelectItem>
                    <SelectItem value="Confident & Direct">Confident & Direct</SelectItem>
                    <SelectItem value="Enthusiastic & Passionate">Enthusiastic & Passionate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  {t.workspace.modelLabel}
                </label>
                <Select value={modelPref} onValueChange={(val) => val && setModelPref(val)}>
                  <SelectTrigger className="w-full h-11 bg-zinc-900/50 border-white/10 text-white focus:ring-cyan-500 transition-all">
                    <SelectValue placeholder="Select a model">
                      {modelPref === "speed" ? "Speed (Flash)" : "Reasoning (Pro)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white z-[100]">
                    <SelectItem value="speed">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        Speed (Flash)
                      </div>
                    </SelectItem>
                    <SelectItem value="reasoning">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-amethyst-glow" />
                        Reasoning (Pro)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 space-y-4 flex flex-col min-h-0">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  {t.workspace.jobDescriptionLabel}
                </label>
                <Textarea
                  placeholder={t.workspace.placeholder}
                  className="w-full bg-zinc-900/50 border-white/10 text-white font-mono text-sm leading-relaxed focus-visible:ring-amethyst-glow resize-none min-h-[250px] max-h-[400px] overflow-y-auto"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="relative group">
              {/* Shimmer Border effect (Thinking State) */}
              {isLoading && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amethyst-glow via-cyan-400 to-amethyst-glow rounded-md blur opacity-75 animate-pulse" />
              )}
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !jobDescription.trim()}
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] transition-all font-medium py-6 rounded-xl group relative overflow-hidden"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 w-full relative z-10">
                    <Sparkles className="w-5 h-5 group-hover:text-amethyst-glow transition-colors" />
                    {t.workspace.btnGenerate}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Output Preview */}
      <div 
        ref={outputRef}
        className="w-full lg:w-2/3 min-h-[500px] ethereal-panel rounded-xl flex flex-col relative overflow-hidden group"
      >
        
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-amethyst-glow/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        {/* Copy to Clipboard Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end items-center bg-gradient-to-b from-zinc-950/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            disabled={!completion || isLoading}
            className="bg-white/10 hover:bg-white/20 text-white border-white/5 backdrop-blur-md"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 p-8 md:p-12 prose prose-invert prose-p:text-zinc-300 prose-headings:text-white max-w-none">
          {completion ? (
            <div className="font-serif text-lg leading-relaxed text-zinc-200 relative z-10">
              <div className="flex justify-between items-center text-xs text-zinc-500 px-1 mb-4">
                <span>{dailyLimit} limit remaining today</span>
              </div>
              <ReactMarkdown>{completion}</ReactMarkdown>
            </div>
          ) : isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-32 relative z-10">
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
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-32 relative z-10">
              <div className="relative group-hover:scale-110 transition-transform duration-700">
                <div className="absolute inset-0 bg-amethyst-glow/20 blur-xl rounded-full"></div>
                <div className="w-20 h-20 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-sm relative z-10 rotate-3 group-hover:rotate-6 transition-transform">
                  <Sparkles className="w-10 h-10 text-amethyst-glow" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{t.workspace.title}</h3>
                <p className="text-zinc-400 max-w-sm mx-auto">
                  {t.workspace.subtitle}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Upgrade to Pro Modal */}
      <Dialog open={showProModal} onOpenChange={setShowProModal}>
        <DialogContent className="bg-zinc-950 border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amethyst-glow/20 flex items-center justify-center mb-4 border border-amethyst-glow/30">
              <Zap className="w-6 h-6 text-amethyst-glow" />
            </div>
            <DialogTitle className="text-center text-xl">Out of Credits</DialogTitle>
            <DialogDescription className="text-center text-zinc-400">
              You've used all your free generation credits. Upgrade to Vellura Pro for unlimited cover letters, AI pitches, and advanced resume tailoring.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-center">
            <Button className="w-full bg-gradient-to-r from-amethyst-glow to-cyan-500 hover:opacity-90 text-white border-none font-semibold">
              Upgrade to Pro — $9/mo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
