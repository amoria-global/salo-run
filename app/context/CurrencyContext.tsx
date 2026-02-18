"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type CurrencyCode = "USD" | "RWF" | "EUR" | "KES" | "UGX" | "TZS";

interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rate: number;
  decimals: number;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amountInUSD: number) => string;
  currencies: CurrencyInfo[];
}

const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "us", rate: 1, decimals: 2 },
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF", flag: "rw", rate: 1460, decimals: 0 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "eu", rate: 0.84, decimals: 2 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KES", flag: "ke", rate: 132.73, decimals: 0 },
  { code: "UGX", name: "Ugandan Shilling", symbol: "UGX", flag: "ug", rate: 3561, decimals: 0 },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS", flag: "tz", rate: 2607, decimals: 0 },
];

const STORAGE_KEY = "connekt-currency";

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      setCurrencyState(saved as CurrencyCode);
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const formatPrice = useCallback(
    (amountInUSD: number) => {
      const info = CURRENCIES.find((c) => c.code === currency)!;
      const converted = amountInUSD * info.rate;
      const formatted = converted.toLocaleString("en-US", {
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      });

      if (info.code === "USD") return `$${formatted}`;
      if (info.code === "EUR") return `€${formatted}`;
      return `${info.symbol} ${formatted}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice, currencies: CURRENCIES }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
