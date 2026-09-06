"use client";

import { AlertTriangle } from "lucide-react";
import type { LanguageType } from "@/utils/i18n/dictionaries";

export type JdIssue =
  | "too_short"
  | "too_long"
  | "link_only"
  | "lorem"
  | "gibberish"
  | "looks_like_cv"
  | "no_offer_signals";

export interface JdAnalysis {
  level: "ok" | "warn";
  issues: JdIssue[];
  words: number;
  chars: number;
}

// Offer signals across the 4 supported languages. Detection runs against all
// sets at once — a Spanish posting with an English paragraph still matches.
const OFFER_KEYWORDS: Record<string, string[]> = {
  es: [
    "buscamos", "requisitos", "requerimos", "funciones", "responsabilidades",
    "ofrecemos", "beneficios", "jornada", "salario", "experiencia mínima",
    "experiencia minima", "perfil buscado", "vacante", "puesto", "postúlate",
    "postulate", "contratación", "contratacion", "modalidad",
  ],
  en: [
    "we are looking", "requirements", "responsibilities", "benefits",
    "we offer", "qualifications", "job type", "full-time", "full time",
    "about the role", "what you'll do", "what you will do", "apply now",
    "salary range", "nice to have",
  ],
  fr: [
    "nous recherchons", "profil recherché", "profil recherche", "missions",
    "responsabilités", "responsabilites", "avantages", "nous offrons",
    "type de contrat", "postulez", "rémunération", "remuneration",
    "expérience requise", "experience requise",
  ],
  pt: [
    "buscamos", "requisitos", "responsabilidades", "benefícios", "beneficios",
    "oferecemos", "vaga", "cargo", "jornada", "salário", "salario",
    "candidate-se", "contratação", "contratacao", "modalidade",
  ],
};

// Signals that the pasted text is a résumé/CV (or personal data), not a posting.
const CV_KEYWORDS = [
  "experiencia laboral", "work experience", "expériences professionnelles",
  "experiencia profesional", "experiência profissional", "objetivo profesional",
  "professional summary", "historial laboral", "referencias personales",
  "personal references", "fecha de nacimiento", "date of birth",
  "estado civil", "curriculum vitae", "hoja de vida", "mi nombre es",
  "my name is", "je m'appelle", "meu nome é", "meu nome e",
];

export function analyzeJobDescription(raw: string): JdAnalysis {
  const text = (raw || "").trim();
  const chars = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const issues: JdIssue[] = [];
  if (!text) return { level: "ok", issues, words, chars };

  if (words < 20) issues.push("too_short");
  if (chars > 12000) issues.push("too_long");

  const compact = text.replace(/\s+/g, " ").trim();
  if (
    /^(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+)(\s+(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+))*$/.test(
      compact
    )
  ) {
    issues.push("link_only");
  }

  if (/lorem ipsum/i.test(text)) issues.push("lorem");

  const lower = text.toLowerCase();
  const longRun = /(.)\1{9,}/.test(text);
  const consonantRuns = (lower.match(/[bcdfghjklmnpqrstvwxzçñ]{8,}/g) || []).length;
  const letters = (text.match(/[a-zà-ÿâêîôûäëïöüãõçñ]/gi) || []).length;
  const alphaRatio = chars ? letters / chars : 1;
  if (longRun || consonantRuns >= 2 || (chars > 120 && alphaRatio < 0.4)) {
    issues.push("gibberish");
  }

  let offer = 0;
  let cv = 0;
  for (const list of Object.values(OFFER_KEYWORDS)) {
    for (const k of list) {
      if (lower.includes(k)) offer++;
    }
  }
  for (const k of CV_KEYWORDS) {
    if (lower.includes(k)) cv++;
  }
  if (cv >= 2 && offer === 0) {
    issues.push("looks_like_cv");
  } else if (offer === 0 && cv === 0 && words >= 60) {
    issues.push("no_offer_signals");
  }

  return { level: issues.length ? "warn" : "ok", issues, words, chars };
}

const MESSAGES: Record<JdIssue, Record<LanguageType, string>> = {
  too_short: {
    Spanish: "El texto es muy corto para una oferta (menos de 20 palabras). Revisa que hayas pegado la descripción completa.",
    English: "The text is very short for a job posting (under 20 words). Check that you pasted the full description.",
    French: "Le texte est très court pour une offre (moins de 20 mots). Vérifiez que vous avez collé la description complète.",
    Portuguese: "O texto é muito curto para uma vaga (menos de 20 palavras). Verifique se você colou a descrição completa.",
  },
  too_long: {
    Spanish: "El texto es muy largo (más de 12.000 caracteres). La IA usará el inicio; recorta a los requisitos y funciones clave.",
    English: "The text is very long (over 12,000 characters). The AI will use the beginning; trim it to key requirements and duties.",
    French: "Le texte est très long (plus de 12 000 caractères). L'IA utilisera le début ; réduisez aux exigences et missions clés.",
    Portuguese: "O texto é muito longo (mais de 12.000 caracteres). A IA usará o início; reduza aos requisitos e funções principais.",
  },
  link_only: {
    Spanish: "Esto parece solo un enlace o un correo, no una descripción. Abre la oferta y pega el texto de los requisitos y funciones.",
    English: "This looks like just a link or an email, not a description. Open the posting and paste the requirements and duties text.",
    French: "Cela ressemble à un simple lien ou e-mail, pas à une description. Ouvrez l'offre et collez le texte des exigences et missions.",
    Portuguese: "Isso parece apenas um link ou e-mail, não uma descrição. Abra a vaga e cole o texto dos requisitos e funções.",
  },
  lorem: {
    Spanish: "El texto contiene «lorem ipsum» (relleno de prueba). Pega la oferta real antes de generar.",
    English: "The text contains “lorem ipsum” (placeholder filler). Paste the real posting before generating.",
    French: "Le texte contient du « lorem ipsum » (remplissage). Collez la vraie offre avant de générer.",
    Portuguese: "O texto contém “lorem ipsum” (preenchimento). Cole a vaga real antes de gerar.",
  },
  gibberish: {
    Spanish: "El texto parece ilegible o corrupto (caracteres repetidos o sin vocales). Revisa lo que pegaste.",
    English: "The text looks garbled or corrupted (repeated characters or no vowels). Review what you pasted.",
    French: "Le texte semble illisible ou corrompu (caractères répétés ou sans voyelles). Vérifiez ce que vous avez collé.",
    Portuguese: "O texto parece ilegível ou corrompido (caracteres repetidos ou sem vogais). Revise o que você colou.",
  },
  looks_like_cv: {
    Spanish: "Esto parece un CV, no una oferta de trabajo. Aquí va la descripción del puesto (requisitos, funciones); tu CV ya lo tenemos guardado.",
    English: "This looks like a résumé, not a job posting. Paste the role description here (requirements, duties); your résumé is already saved.",
    French: "Cela ressemble à un CV, pas à une offre d'emploi. Collez ici la description du poste (exigences, missions) ; votre CV est déjà enregistré.",
    Portuguese: "Isso parece um currículo, não uma vaga. Cole aqui a descrição do cargo (requisitos, funções); seu currículo já está salvo.",
  },
  no_offer_signals: {
    Spanish: "No detectamos señales típicas de oferta (requisitos, funciones, beneficios). Si es un texto libre o una imagen mal copiada, revísalo.",
    English: "We couldn't detect typical posting signals (requirements, duties, benefits). If it's free-form text or a badly copied image, review it.",
    French: "Aucun signal typique d'offre détecté (exigences, missions, avantages). S'il s'agit d'un texte libre ou d'une image mal copiée, vérifiez-le.",
    Portuguese: "Não detectamos sinais típicos de vaga (requisitos, funções, benefícios). Se for texto livre ou imagem mal copiada, revise.",
  },
};

const TITLE: Record<LanguageType, string> = {
  Spanish: "Revisa la descripción antes de generar",
  English: "Review the description before generating",
  French: "Vérifiez la description avant de générer",
  Portuguese: "Revise a descrição antes de gerar",
};

const NOTE: Record<LanguageType, string> = {
  Spanish: "Aviso informativo: puedes generar igualmente.",
  English: "Informational: you can still generate.",
  French: "Informatif : vous pouvez quand même générer.",
  Portuguese: "Informativo: você ainda pode gerar.",
};

// Non-blocking amber notice. Returns null when the text looks fine, so the
// caller can render it unconditionally next to the textarea.
export function JdFeedbackBox({
  analysis,
  lang,
}: {
  analysis: JdAnalysis;
  lang: LanguageType;
}) {
  if (analysis.level !== "warn" || analysis.issues.length === 0) return null;
  const language: LanguageType = MESSAGES.too_short[lang] ? lang : "Spanish";
  return (
    <div className="mt-1.5 flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold text-amber-200">{TITLE[language]}</p>
        <ul className="space-y-0.5">
          {analysis.issues.map((issue) => (
            <li key={issue} className="text-[11px] leading-relaxed text-amber-200/80">
              • {MESSAGES[issue][language]}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-zinc-400">{NOTE[language]}</p>
      </div>
    </div>
  );
}
