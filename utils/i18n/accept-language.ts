/**
 * Maps a raw browser `Accept-Language` header value (RFC 4647 syntax) to one
 * of the Vellura-supported languages. Used by the root layout to pick the
 * initial UI language for a brand-new visitor (no cookie, no DB profile yet).
 *
 * Returns a LanguageType value, or `null` if no match was found. The caller
 * is responsible for the final fallback (English in the root layout, the
 * user's own DB setting in the dashboard layout).
 *
 * Quality-value sorting and wildcards are handled so a header like
 * `fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7` returns `"French"`.
 */

import { LanguageType } from "./dictionaries";

const SUPPORTED: LanguageType[] = ["Spanish", "English", "French", "Portuguese"];

// Maps the ISO 639-1 (or 639-3) language code to a Vellura LanguageType.
// Covers common variants and fallbacks for the four supported languages.
const LANG_CODE_MAP: Record<string, LanguageType> = {
  es: "Spanish",
  spa: "Spanish",
  "es-es": "Spanish",
  "es-mx": "Spanish",
  "es-ar": "Spanish",
  en: "English",
  eng: "English",
  "en-us": "English",
  "en-gb": "English",
  "en-ca": "English",
  "en-au": "English",
  fr: "French",
  fra: "French",
  fre: "French",
  "fr-fr": "French",
  "fr-ca": "French",
  "fr-be": "French",
  "fr-ch": "French",
  pt: "Portuguese",
  por: "Portuguese",
  "pt-br": "Portuguese",
  "pt-pt": "Portuguese",
  "pt-ao": "Portuguese",
  "pt-mz": "Portuguese",
};

/**
 * Parse a single Accept-Language entry like `"fr-FR"` or `"en;q=0.9"` into
 * `{ code, quality }`. Quality defaults to 1 when omitted.
 */
function parseEntry(raw: string): { code: string; quality: number } {
  const [code, ...params] = raw.trim().split(";");
  const qualityParam = params
    .map((p) => p.trim())
    .find((p) => p.startsWith("q="));
  const quality = qualityParam ? Number(qualityParam.slice(2)) || 0 : 1;
  return { code: code.trim().toLowerCase(), quality };
}

/**
 * Resolve a single language code (lowercased, may include region like
 * `pt-br`) to a supported LanguageType, or null if it doesn't match.
 * Falls back from a regional variant to its base language.
 */
function resolveCode(code: string): LanguageType | null {
  if (LANG_CODE_MAP[code]) {
    return LANG_CODE_MAP[code];
  }
  // Strip the region and try the base language (e.g. "pt-br" -> "pt").
  const base = code.split("-")[0];
  return LANG_CODE_MAP[base] ?? null;
}

/**
 * Given a raw `Accept-Language` header, return the highest-priority supported
 * language, or `null` if none of the requested languages are supported.
 */
export function detectLanguageFromHeader(header: string | null | undefined): LanguageType | null {
  if (!header || typeof header !== "string") return null;

  const entries = header
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseEntry)
    .filter((e) => e.code.length > 0)
    // Highest quality first; preserve header order as tie-breaker.
    .sort((a, b) => b.quality - a.quality);

  for (const entry of entries) {
    const resolved = resolveCode(entry.code);
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Convenience that combines detection with the final English fallback.
 * Use this in the root layout (no DB to fall back to).
 */
export function resolveInitialLanguage(
  acceptLanguageHeader: string | null | undefined,
  cookieValue?: string | null
): LanguageType {
  if (cookieValue && SUPPORTED.includes(cookieValue as LanguageType)) {
    return cookieValue as LanguageType;
  }
  const detected = detectLanguageFromHeader(acceptLanguageHeader);
  if (detected) return detected;
  return "English";
}
