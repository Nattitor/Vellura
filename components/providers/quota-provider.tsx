"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface QuotaContextType {
  dailyLimit: number;
  setDailyLimit: (limit: number | ((prev: number) => number)) => void;
  decrementLimit: () => void;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export function QuotaProvider({
  initialLimit = 5,
  children,
}: {
  initialLimit?: number;
  children: React.ReactNode;
}) {
  const [dailyLimit, setDailyLimit] = useState(initialLimit);

  useEffect(() => {
    setDailyLimit(initialLimit);
  }, [initialLimit]);

  const decrementLimit = () => {
    setDailyLimit((prev) => Math.max(0, prev - 1));
  };

  return (
    <QuotaContext.Provider value={{ dailyLimit, setDailyLimit, decrementLimit }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const context = useContext(QuotaContext);
  if (!context) {
    throw new Error("useQuota must be used within a QuotaProvider");
  }
  return context;
}
