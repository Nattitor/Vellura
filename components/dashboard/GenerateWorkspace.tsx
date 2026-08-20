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
import { Copy, Check, Sparkles, Loader2, AlertCircle } from "lucide-react";

export function GenerateWorkspace() {
  const [tone, setTone] = useState("Professional & Polished");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    completion,
    complete,
    isLoading,
    error,
  } = useCompletion({
    api: "/api/generate",
    body: { tone },
    streamProtocol: "text",
    onError: (err) => {
      console.error(err);
    }
  });

  const handleGenerate = async () => {
    console.log("Generate clicked, jobDescription:", jobDescription);
    if (!jobDescription.trim()) return;
    
    try {
      console.log("Calling complete...");
      await complete(jobDescription);
      console.log("complete finished!");
    } catch (e) {
      console.error("complete threw an error:", e);
    }
  };

  const handleCopy = () => {
    if (!completion) return;
    navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Input Form */}
      <div className="w-full lg:w-1/3 flex flex-col space-y-4">
        <div className="ethereal-panel p-6 rounded-xl flex flex-col flex-1">
          <h2 className="text-xl font-bold text-white mb-2">Job Context</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Paste the job description below. We'll automatically merge this with your master resume.
          </p>

          <div className="space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full bg-zinc-900/50 border-white/10 text-white focus:ring-amethyst-glow">
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="Professional & Polished">Professional & Polished</SelectItem>
                  <SelectItem value="Confident & Direct">Confident & Direct</SelectItem>
                  <SelectItem value="Enthusiastic & Passionate">Enthusiastic & Passionate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-sm font-medium text-zinc-300">Job Description</label>
              <Textarea
                placeholder="e.g. We are looking for a Senior Frontend Engineer with 5+ years of React experience..."
                className="flex-1 bg-zinc-900/50 border-white/10 text-white font-mono text-sm leading-relaxed focus-visible:ring-amethyst-glow resize-none min-h-[200px]"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">
                  {error.message || "An error occurred. Please make sure you have saved your Master Resume in Settings."}
                </p>
              </div>
            )}
            
            <div className="relative group">
              {/* Shimmer Border effect (Thinking State) */}
              {isLoading && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amethyst-glow via-cyan-400 to-amethyst-glow rounded-md blur opacity-75 animate-pulse" />
              )}
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !jobDescription.trim()}
                className="relative w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-amethyst-glow" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 text-amethyst-glow" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Output Preview */}
      <div className="w-full lg:w-2/3 ethereal-panel rounded-xl flex flex-col relative overflow-hidden group">
        
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
            <div className="font-serif text-lg leading-relaxed text-zinc-200">
              <ReactMarkdown>{completion}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 py-32">
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-zinc-500" />
              </div>
              <div>
                <p className="text-zinc-400 font-medium">No document generated yet</p>
                <p className="text-sm text-zinc-500">Add your job description and hit generate.</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
