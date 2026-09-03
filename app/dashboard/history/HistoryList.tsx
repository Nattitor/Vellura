"use client";

import { useState, useMemo, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Copy, 
  Check, 
  Download, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Briefcase, 
  Search, 
  X, 
  Trash2, 
  Sparkles, 
  Brain, 
  Clock, 
  Calendar,
  Layers,
  ChevronDown,
  History
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { extractCompanyAndRole } from "@/utils/extract-company";
import { getModelDisplayInfo as getModelInfo } from "@/utils/model-display";
import { deleteDocument } from "@/app/actions/documents";
import { exportDocumentToPDF } from "@/lib/pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [documents, setDocuments] = useState<Document[]>(initialDocuments || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Deletion modal state
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();



  // Executive Stats Calculation
  const stats = useMemo(() => {
    const total = documents.length;
    if (total === 0) return { total: 0, topModel: "—", lastDate: t.history.never || "Never" };

    const modelFrequency: Record<string, number> = {};
    documents.forEach((d) => {
      const { label } = getModelInfo(d.ai_model_used);
      modelFrequency[label] = (modelFrequency[label] || 0) + 1;
    });

    let topModel = "—";
    let maxCount = 0;
    Object.entries(modelFrequency).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topModel = m;
      }
    });

    const lastDate = documents[0] ? format(new Date(documents[0].created_at), "MMM d, yyyy") : "—";
    return { total, topModel, lastDate };
  }, [documents, t.history.never]);

  // Provider Filter Counts
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    documents.forEach((d) => {
      const { provider } = getModelInfo(d.ai_model_used);
      counts[provider] = (counts[provider] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Filtered documents by Search Query and Provider Filter
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const { provider, label } = getModelInfo(doc.ai_model_used);
      
      // Provider filter check
      if (selectedProviderFilter !== "all" && provider !== selectedProviderFilter) {
        return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const displayTitle = (doc.company_name && doc.company_name !== "Not Specified")
          ? doc.company_name.toLowerCase()
          : extractCompanyAndRole(doc.job_description, doc.generated_content).toLowerCase();
        const cleanContent = doc.generated_content.toLowerCase();
        const jobDesc = doc.job_description.toLowerCase();
        const model = label.toLowerCase();

        return (
          displayTitle.includes(query) ||
          cleanContent.includes(query) ||
          jobDesc.includes(query) ||
          model.includes(query)
        );
      }

      return true;
    });
  }, [documents, searchQuery, selectedProviderFilter]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleProviderFilterChange = (provider: string) => {
    setSelectedProviderFilter(provider);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Smoothly scroll container into view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Copy Action
  const handleCopy = (content: string, id: string) => {
    const cleanContent = content.replace(/<!--[\s\S]*?-->/g, "").trim();
    navigator.clipboard.writeText(cleanContent);
    setCopiedId(id);
    toast.success(t.workspace.copied || "Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // PDF Export Action
  const handleDownloadPDF = async (content: string, id: string) => {
    try {
      setDownloadingId(id);
      await exportDocumentToPDF({
        content,
        fileName: `vellura-cover-letter-${id.slice(0, 6)}.pdf`,
      });
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete Action
  const handleDeleteConfirm = () => {
    if (!docToDelete) return;
    const targetId = docToDelete.id;

    startDeleteTransition(async () => {
      const res = await deleteDocument(targetId);
      if (res?.error) {
        toast.error(t.history.deleteError || "Failed to delete document");
      } else {
        setDocuments((prev) => prev.filter((d) => d.id !== targetId));
        if (expandedId === targetId) setExpandedId(null);
        toast.success(t.history.deleteSuccess || "Document deleted successfully.");
      }
      setDocToDelete(null);
    });
  };

  // Word count helper
  const getDocWordCount = (text: string) => {
    const clean = text.replace(/<!--[\s\S]*?-->/g, "").trim();
    return clean ? clean.split(/\s+/).length : 0;
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <History className="w-8 h-8 text-cyan-400" />
            {t.history.title}
          </h1>
          <p className="text-zinc-400 text-sm">{t.history.subtitle}</p>
        </div>

        <div className="flex flex-col items-center justify-center p-16 ethereal-panel rounded-2xl border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/90 border border-white/15 flex items-center justify-center backdrop-blur-sm relative z-10 rotate-3 transition-transform shadow-xl">
              <FileText className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-white mt-8 mb-2 z-10">{t.history.emptyTitle}</h3>
          <p className="text-zinc-400 text-center max-w-md z-10 text-sm leading-relaxed">
            {t.history.emptySubtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            <History className="w-8 h-8 text-cyan-400" />
            {t.history.title}
          </h1>
          <p className="text-zinc-400 text-sm">{t.history.subtitle}</p>
        </div>
      </div>

      {/* Executive Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-3.5 relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">{t.history.totalDocs}</span>
            <span className="text-xl font-bold text-white tracking-tight">{stats.total}</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-3.5 relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-amethyst-glow/10 border border-amethyst-glow/20 flex items-center justify-center shrink-0 text-amethyst-glow group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-zinc-400 font-medium block truncate">{t.history.mostUsedModel}</span>
            <span className="text-base font-bold text-white tracking-tight truncate block">{stats.topModel}</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-3.5 relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">{t.history.lastActivity}</span>
            <span className="text-sm font-bold text-white tracking-tight">{stats.lastDate}</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Provider Filters */}
      <div className="space-y-3 bg-zinc-950/70 border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder={t.history.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-zinc-900/80 border-white/10 text-white pl-10 pr-9 h-10 text-xs rounded-xl focus-visible:ring-cyan-500 placeholder:text-zinc-500 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs text-zinc-400 font-medium">{t.history.itemsPerPage}:</span>
            <div className="flex items-center bg-zinc-900/80 border border-white/10 rounded-xl p-0.5">
              {[6, 12, 24].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setPageSize(size); setCurrentPage(1); }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    pageSize === size 
                      ? "bg-cyan-500 text-zinc-950 shadow-sm" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { id: "all", label: t.history.filterAll || "All Models", count: providerCounts.all },
            { id: "google", label: "Google Gemini", count: providerCounts.google },
            { id: "openai", label: "OpenAI", count: providerCounts.openai },
            { id: "anthropic", label: "Anthropic Claude", count: providerCounts.anthropic },
            { id: "deepseek", label: "DeepSeek", count: providerCounts.deepseek },
            { id: "openrouter", label: "OpenRouter", count: providerCounts.openrouter },
          ].map((tab) => {
            if (tab.id !== "all" && !tab.count) return null;
            const isSelected = selectedProviderFilter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleProviderFilterChange(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5 hover:bg-zinc-800/80"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-cyan-400/20 text-cyan-200" : "bg-white/10 text-zinc-400"
                }`}>
                  {tab.count || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Document Table / List */}
      <div className="w-full flex flex-col ethereal-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950/60">
        
        {/* Table Header Bar */}
        <div className="flex items-center px-6 py-3.5 border-b border-white/10 bg-zinc-900/50 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="w-8 shrink-0"></div>
          <div className="flex-1 min-w-0">{t.history.colCompany}</div>
          <div className="w-36 hidden sm:block">{t.history.colModel}</div>
          <div className="w-32 hidden md:block text-right">{t.history.colDate}</div>
          <div className="w-24 text-right"></div>
        </div>

        {/* Empty Search State */}
        {filteredDocuments.length === 0 && (
          <div className="py-16 text-center space-y-3 px-4">
            <Search className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-base font-semibold text-white">{t.history.noMatchesFound}</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(""); setSelectedProviderFilter("all"); setCurrentPage(1); }}
              className="border-white/10 hover:bg-white/5 text-xs text-cyan-400 cursor-pointer"
            >
              {t.history.resetFilters}
            </Button>
          </div>
        )}

        {/* Document Accordion Rows */}
        <div className="divide-y divide-white/5">
          {paginatedDocuments.map((doc) => {
            const isExpanded = expandedId === doc.id;
            const displayTitle = (doc.company_name && doc.company_name !== "Not Specified")
              ? doc.company_name
              : extractCompanyAndRole(doc.job_description, doc.generated_content);
            const { label: modelLabel, badgeColor } = getModelInfo(doc.ai_model_used);
            const wordCount = getDocWordCount(doc.generated_content);

            return (
              <div key={doc.id} className="flex flex-col group/row transition-colors">
                {/* Inbox Row */}
                <div
                  className={cn(
                    "flex items-center px-6 py-4 hover:bg-zinc-900/60 transition-colors w-full cursor-pointer",
                    isExpanded ? "bg-zinc-900/40" : ""
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                >
                  {/* Expand Chevron Icon */}
                  <div className="w-8 shrink-0 text-zinc-500 group-hover/row:text-cyan-400 transition-colors">
                    <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-90 text-cyan-400")} />
                  </div>

                  {/* Company & Targeting Details */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={cn(
                      "text-sm font-semibold truncate transition-colors",
                      isExpanded ? "text-cyan-300" : "text-white group-hover/row:text-zinc-100"
                    )}>
                      {displayTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{t.history.targeting}</span>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {wordCount} {t.history.docWordCount || "words"}
                      </span>
                    </div>
                  </div>

                  {/* AI Model Badge */}
                  <div className="w-36 hidden sm:flex items-center shrink-0">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border font-mono shadow-sm",
                      badgeColor
                    )}>
                      {modelLabel}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="w-32 hidden md:block text-right shrink-0">
                    <span className="text-xs text-zinc-400">
                      {format(new Date(doc.created_at), "MMM d • h:mm a")}
                    </span>
                  </div>

                  {/* Quick Action Delete / Expand */}
                  <div className="w-24 flex items-center justify-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title={t.history.deleteBtn || "Delete"}
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {isExpanded ? (t.history.hideDetails || "Hide") : (t.history.viewDetails || "View")}
                    </button>
                  </div>
                </div>

                {/* Expanded Document View */}
                {isExpanded && (
                  <div className="w-full bg-zinc-950/90 border-t border-b border-white/10 p-6 sm:p-8 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="max-w-4xl mx-auto space-y-6">
                      
                      {/* Document Meta Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>{displayTitle}</span>
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                              {format(new Date(doc.created_at), "MMMM d, yyyy • h:mm a")}
                            </span>
                            <span>•</span>
                            <span className="text-cyan-300 font-mono">
                              {modelLabel}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-zinc-400">
                              {wordCount} {t.history.docWordCount || "words"}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            onClick={() => handleCopy(doc.generated_content, doc.id)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs px-3.5 py-1.5 h-8 rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                          >
                            {copiedId === doc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-zinc-300" />
                            )}
                            <span>{copiedId === doc.id ? t.history.copiedBtn : t.history.copyBtn}</span>
                          </Button>

                          <Button
                            type="button"
                            onClick={() => handleDownloadPDF(doc.generated_content, doc.id)}
                            disabled={downloadingId === doc.id}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3.5 py-1.5 h-8 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)] active:scale-95 transition-all"
                          >
                            <Download className={cn("w-3.5 h-3.5", downloadingId === doc.id && "animate-bounce")} />
                            <span>{t.history.pdfBtn}</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDocToDelete(doc)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-3 py-1.5 h-8 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Document Content Paper Card */}
                      <div className="bg-zinc-900/40 p-6 sm:p-10 rounded-2xl border border-white/10 shadow-inner max-h-[700px] overflow-y-auto ethereal-scrollbar">
                        <article className="prose prose-invert prose-p:font-serif prose-headings:font-serif prose-sm sm:prose-base max-w-none text-zinc-200 leading-relaxed font-serif">
                          <ReactMarkdown>
                            {doc.generated_content.replace(/<!--[\s\S]*?-->/g, "").trim()}
                          </ReactMarkdown>
                        </article>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Luxury Pagination Footer */}
        {filteredDocuments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-zinc-900/60">
            {/* Showing Range Info */}
            <div className="text-xs text-zinc-400 font-medium">
              <span>{t.history.showingResults} </span>
              <strong className="text-white">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredDocuments.length)}
              </strong>
              <span> {t.history.of} </span>
              <strong className="text-white">{filteredDocuments.length}</strong>
              <span> {t.history.totalDocs?.toLowerCase()}</span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              {/* Previous Page Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-white/10 hover:bg-white/5 text-xs text-zinc-300 disabled:opacity-30 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.history.prevPage}</span>
              </Button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show max 5 buttons (first, last, current, adjacent)
                  if (
                    totalPages > 5 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1
                  ) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="text-xs text-zinc-600 px-1">...</span>;
                    }
                    return null;
                  }

                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        isActive
                          ? "bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                          : "text-zinc-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 border-white/10 hover:bg-white/5 text-xs text-zinc-300 disabled:opacity-30 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <span className="hidden sm:inline">{t.history.nextPage}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent className="bg-zinc-950 border border-red-500/30 text-white sm:max-w-md p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <DialogTitle className="text-lg font-bold text-white">
                {t.history.confirmDeleteTitle || "Delete Document"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
                {t.history.confirmDeleteDesc || "Are you sure you want to delete this document? This action cannot be undone."}
              </DialogDescription>
            </div>
          </DialogHeader>

          {docToDelete && (
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/5 text-xs text-zinc-300 truncate">
              <strong>{docToDelete.company_name && docToDelete.company_name !== "Not Specified" ? docToDelete.company_name : extractCompanyAndRole(docToDelete.job_description, docToDelete.generated_content)}</strong>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDocToDelete(null)}
              disabled={isDeleting}
              className="flex-1 border-white/10 hover:bg-white/5 text-zinc-300 text-xs rounded-xl cursor-pointer"
            >
              {t.history.cancelDeleteBtn || "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95"
            >
              {isDeleting ? (t.history.deletingBtn || "Deleting...") : (t.history.deleteBtn || "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
