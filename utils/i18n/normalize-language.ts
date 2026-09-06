import type { LanguageType } from "./dictionaries";

const OUTPUT_LANGUAGE_NAMES: LanguageType[] = ["Spanish", "English", "French", "Portuguese"];

// Accepts ISO codes, locale tags and native names — the DB/cookies/localStorage
// may hold any of these from older flows, and the Select triggers + AI prompt
// only understand the canonical LanguageType names.
const CODE_TO_LANGUAGE: Record<string, LanguageType> = {
  es: "Spanish",
  spa: "Spanish",
  "es-es": "Spanish",
  "es-mx": "Spanish",
  "es-ar": "Spanish",
  "es-co": "Spanish",
  espanol: "Spanish",
  español: "Spanish",
  castellano: "Spanish",
  en: "English",
  eng: "English",
  "en-us": "English",
  "en-gb": "English",
  fr: "French",
  fra: "French",
  fre: "French",
  "fr-fr": "French",
  francais: "French",
  français: "French",
  pt: "Portuguese",
  por: "Portuguese",
  "pt-br": "Portuguese",
  br: "Portuguese",
  portugues: "Portuguese",
  português: "Portuguese",
};

export function normalizeOutputLanguage(raw: unknown, fallback: LanguageType = "Spanish"): LanguageType {
  if (typeof raw !== "string") return fallback;
  const clean = raw.trim().toLowerCase();
  if (!clean) return fallback;
  const byName = OUTPUT_LANGUAGE_NAMES.find((n) => n.toLowerCase() === clean);
  if (byName) return byName;
  return CODE_TO_LANGUAGE[clean] ?? fallback;
}
