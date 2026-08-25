"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Download, FileText, ChevronRight, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

type Document = {
  id: string;
  user_id: string;
  company_name: string;
  job_description: string;
  generated_content: string;
  ai_model_used: string;
  created_at: string;
};

export default function HistoryList({ initialDocuments }: { initialDocuments: Document[] }) {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPDF = async (content: string, id: string) => {
    try {
      setDownloadingId(id);
      
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      let plainText = content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s?/g, '');
        
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
      
      doc.save(`cover-letter-${id.slice(0,6)}.pdf`);
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!initialDocuments || initialDocuments.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t.history.title}</h1>
          <p className="text-zinc-400">
            {t.history.subtitle}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center p-16 mt-8 ethereal-panel rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative group-hover:scale-110 transition-transform duration-700">
            <div className="absolute inset-0 bg-amethyst-glow/10 blur-xl rounded-full"></div>
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-sm relative z-10 rotate-3 transition-transform">
              <FileText className="w-10 h-10 text-zinc-500 group-hover:text-amethyst-glow transition-colors duration-500" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-white mt-8 mb-2 z-10">{t.history.emptyTitle}</h3>
          <p className="text-zinc-400 text-center max-w-sm z-10">
            {t.history.emptySubtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t.history.title}</h1>
        <p className="text-zinc-400">
          {t.history.subtitle}
        </p>
      </div>

      <div className="w-full flex flex-col ethereal-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="flex items-center px-6 py-4 border-b border-white/5 bg-zinc-950/50">
          <div className="w-8"></div>
          <div className="flex-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.history.colCompany}</div>
          <div className="w-32 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:block">{t.history.colModel}</div>
          <div className="w-40 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">{t.history.colDate}</div>
        </div>
      
      <div className="divide-y divide-white/5">
        {initialDocuments.map((doc) => {
          const isExpanded = expandedId === doc.id;
          return (
            <div key={doc.id} className="flex flex-col">
              {/* Inbox Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                className={cn(
                  "flex items-center px-6 py-4 hover:bg-zinc-900/50 transition-colors w-full text-left group",
                  isExpanded ? "bg-zinc-900/30" : ""
                )}
              >
                <div className="w-8 text-zinc-600 group-hover:text-amethyst-glow transition-colors">
                  <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-90")} />
                </div>
                <div className="flex-1 flex flex-col pr-4 overflow-hidden">
                  <span className={cn(
                    "text-sm font-medium truncate transition-colors",
                    isExpanded ? "text-amethyst-glow" : "text-white"
                  )}>
                    {doc.company_name !== "Not Specified" ? doc.company_name : "General Cover Letter"}
                  </span>
                  <span className="text-xs text-zinc-500 truncate mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    {t.history.targeting}
                  </span>
                </div>
                <div className="w-32 hidden sm:flex items-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-900 border border-white/10 text-zinc-400">
                    {doc.ai_model_used.includes("pro") ? "Pro" : "Speed"}
                  </span>
                </div>
                <div className="w-40 text-right">
                  <span className="text-xs text-zinc-400">
                    {format(new Date(doc.created_at), "MMM d • h:mm a")}
                  </span>
                </div>
              </button>

              {/* Expanded View */}
              {isExpanded && (
                <div className="w-full bg-zinc-950/80 border-t border-b border-white/5 p-6 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amethyst-glow" />
                        {t.history.generatedDoc}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCopy(doc.generated_content, doc.id)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs text-white rounded-md transition-all flex items-center gap-2 border border-white/10"
                        >
                          {copiedId === doc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === doc.id ? t.history.copiedBtn : t.history.copyBtn}
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(doc.generated_content, doc.id)}
                          disabled={downloadingId === doc.id}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-xs text-white rounded-md transition-all flex items-center gap-2 border border-white/10"
                        >
                          <Download className={cn("w-3.5 h-3.5", downloadingId === doc.id && "animate-bounce")} />
                          {t.history.pdfBtn}
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 p-8 rounded-xl border border-white/5 max-h-[600px] overflow-y-auto">
                      <article className="prose prose-invert prose-p:font-serif prose-headings:font-serif prose-sm sm:prose-base max-w-none text-zinc-300">
                        <ReactMarkdown>{doc.generated_content}</ReactMarkdown>
                      </article>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
