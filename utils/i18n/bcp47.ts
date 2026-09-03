/**
 * Maps the Vellura `LanguageType` (display label) to its canonical BCP 47
 * language code, used for the `<html lang="...">` attribute and any other
 * locale-sensitive place where a standardized code is required.
 */

import { LanguageType } from "./dictionaries";

export const LANGUAGE_TYPE_TO_BCP47: Record<LanguageType, string> = {
  Spanish: "es",
  English: "en",
  French: "fr",
  Portuguese: "pt",
};

export function languageTypeToBcp47(lang: LanguageType): string {
  return LANGUAGE_TYPE_TO_BCP47[lang] ?? "en";
}
