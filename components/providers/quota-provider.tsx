"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface QuotaContextType {
  dailyLimit: number;
  setDailyLimit: (limit: number | ((prev: number) => number)) => void;
  decrementLimit: () => void;
  resetToInitial: () => void;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

const DEFAULT_DAILY_LIMIT = 5;
const ONE_MINUTE_MS = 60_000;

function getUtcDayKey(): string {
  // Returns "YYYY-MM-DD" in UTC. Used as a stable key for detecting day rollover.
  return new Date().toISOString().slice(0, 10);
}

export function QuotaProvider({
  initialLimit = DEFAULT_DAILY_LIMIT,
  children,
}: {
  initialLimit?: number;
  children: React.ReactNode;
}) {
  const [dailyLimit, setDailyLimit] = useState(initialLimit);

  useEffect(() => {
    setDailyLimit(initialLimit);
  }, [initialLimit]);

  // Detect UTC midnight rollover while the page is open. When the day changes,
  // reset the local counter to the server-provided initialLimit (which is the
  // canonical value; the server already resets the DB row to DEFAULT_DAILY_LIMIT
  // at midnight UTC via the getEffectiveDailyLimit() logic in the cascade entry).
  useEffect(() => {
    let lastDay = getUtcDayKey();
    const interval = setInterval(() => {
      const currentDay = getUtcDayKey();
      if (currentDay !== lastDay) {
        lastDay = currentDay;
        setDailyLimit(initialLimit);
      }
    }, ONE_MINUTE_MS);
    return () => clearInterval(interval);
  }, [initialLimit]);

  const decrementLimit = () => {
    setDailyLimit((prev) => Math.max(0, prev - 1));
  };

  const resetToInitial = () => {
    setDailyLimit(initialLimit);
  };

  return (
    <QuotaContext.Provider value={{ dailyLimit, setDailyLimit, decrementLimit, resetToInitial }}>
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
