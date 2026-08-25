"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, LanguageType } from "@/utils/i18n/dictionaries";

type LanguageContextType = {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  outputLanguage: string;
  setOutputLanguage: (lang: string) => void;
  t: typeof dictionaries["English"];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children,
  initialLanguage = "English",
  initialOutputLanguage = "English"
}: { 
  children: React.ReactNode,
  initialLanguage?: LanguageType,
  initialOutputLanguage?: string
}) {
  const [language, setLanguageState] = useState<LanguageType>(initialLanguage);
  const [outputLanguage, setOutputLanguageState] = useState<string>(initialOutputLanguage);

  useEffect(() => {
    const savedUi = localStorage.getItem("vellura_ui_language") as LanguageType;
    if (savedUi && dictionaries[savedUi]) {
      setLanguageState(savedUi);
    }
    const savedOutput = localStorage.getItem("vellura_output_language");
    if (savedOutput) {
      setOutputLanguageState(savedOutput);
    }
  }, []);

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem("vellura_ui_language", lang);
  };

  const setOutputLanguage = (lang: string) => {
    setOutputLanguageState(lang);
    localStorage.setItem("vellura_output_language", lang);
  };

  const t = dictionaries[language] || dictionaries["English"];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, outputLanguage, setOutputLanguage, t }}>
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
