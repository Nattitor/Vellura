"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, LanguageType } from "@/utils/i18n/dictionaries";

type LanguageContextType = {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  outputLanguage: string;
  setOutputLanguage: (lang: string) => void;
  t: typeof dictionaries["English"];
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children,
  initialLanguage = "Spanish",
  initialOutputLanguage = "Spanish"
}: { 
  children: React.ReactNode,
  initialLanguage?: LanguageType,
  initialOutputLanguage?: string
}) {
  const [language, setLanguageState] = useState<LanguageType>(initialLanguage);
  const [outputLanguage, setOutputLanguageState] = useState<string>(initialOutputLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUi = localStorage.getItem("vellura_ui_language") as LanguageType;
    if (savedUi && dictionaries[savedUi] && savedUi !== language) {
      setLanguageState(savedUi);
      document.cookie = `vellura_ui_language=${savedUi}; path=/; max-age=31536000; SameSite=Lax`;
    }
    const savedOutput = localStorage.getItem("vellura_output_language");
    if (savedOutput && savedOutput !== outputLanguage) {
      setOutputLanguageState(savedOutput);
      document.cookie = `vellura_output_language=${savedOutput}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("vellura_ui_language", lang);
      document.cookie = `vellura_ui_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  const setOutputLanguage = (lang: string) => {
    setOutputLanguageState(lang);
    try {
      localStorage.setItem("vellura_output_language", lang);
      document.cookie = `vellura_output_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  const t = dictionaries[language] || dictionaries["Spanish"] || dictionaries["English"];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, outputLanguage, setOutputLanguage, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
