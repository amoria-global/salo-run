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
  id?: string;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  /**
   * Format a numeric amount for display in the user's selected currency.
   *
   * @param amount        Numeric amount.
   * @param fromCurrency  Optional ISO-style code that `amount` is denominated
   *                      in (e.g. "RWF", "USD"). When omitted or "USD", the
   *                      amount is treated as USD (back-compat). When the
   *                      code is unknown or its rate is missing, the amount
   *                      is used as-is and no conversion is performed.
   */
  formatPrice: (amount: number, fromCurrency?: string) => string;
  currencies: CurrencyInfo[];
  currencyId: string | undefined;
}

const FLAG_MAP: Record<string, string> = {
  USD: "us", RWF: "rw", EUR: "eu", KES: "ke", UGX: "ug", TZS: "tz",
};

const DECIMALS_MAP: Record<string, number> = {
  USD: 2, EUR: 2, RWF: 0, KES: 0, UGX: 0, TZS: 0,
};

// Fallback rates used when API is unavailable
const DEFAULT_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "us", rate: 1, decimals: 2 },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF", flag: "rw", rate: 1460, decimals: 0 },
  { code: "EUR", name: "Euro", symbol: "\u20ac", flag: "eu", rate: 0.84, decimals: 2 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "ke", rate: 132.73, decimals: 0 },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "ug", rate: 3561, decimals: 0 },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "tz", rate: 2607, decimals: 0 },
];

import { getApiUrl } from '@/lib/api';
import { useDashboardAuth, dashboardAuthFetch } from '../providers/AuthProvider';

const STORAGE_KEY = "connekt-currency";
// Shared with the mobile app: the account keeps the choice so both surfaces agree.
const ACCOUNT_PATH = "/api/remote/customer/profile/display-currency";

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(DEFAULT_CURRENCIES);
  const { isAuthenticated } = useDashboardAuth();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DEFAULT_CURRENCIES.some((c) => c.code === saved)) {
      setCurrencyState(saved as CurrencyCode);
    }
  }, []);

  // Fetch live exchange rates and backend currency IDs
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const apiUrl = getApiUrl();
        const [ratesRes, idsRes] = await Promise.all([
          fetch(`${apiUrl}/api/remote/public/currencies/rates`),
          fetch(`${apiUrl}/api/remote/public/currencies`),
        ]);

        const idMap: Record<string, string> = {};
        if (idsRes.ok) {
          const idsResult = await idsRes.json();
          const idList: { id: string; abbreviation: string }[] = idsResult?.data ?? [];
          idList.forEach((c) => { idMap[c.abbreviation] = c.id; });
        }

        let updatedCurrencies: CurrencyInfo[] = DEFAULT_CURRENCIES.map((c) => ({
          ...c,
          id: idMap[c.code],
        }));

        if (ratesRes.ok) {
          const result = await ratesRes.json();
          const ratesData = result?.data;
          if (ratesData && typeof ratesData === "object") {
            updatedCurrencies = updatedCurrencies.map((c) => {
              const apiRate = ratesData[c.code];
              if (apiRate && apiRate.rateToUsd != null) {
                return {
                  ...c,
                  rate: parseFloat(apiRate.rateToUsd),
                  symbol: apiRate.symbol || c.symbol,
                  name: apiRate.name || c.name,
                };
              }
              return c;
            });
          }
        }

        setCurrencies(updatedCurrencies);
      } catch {
        // Silently fall back to default rates when API is unavailable
      }
    };
    fetchRates();
  }, []);

  const saveToAccount = useCallback(async (code: CurrencyCode) => {
    try {
      await dashboardAuthFetch(`${getApiUrl()}${ACCOUNT_PATH}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: code }),
      });
    } catch {
      // Offline: the browser keeps the choice and the next sign-in retries.
    }
  }, []);

  // Signed in: the account's saved currency wins; if it has none yet, save this browser's choice to it.
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}${ACCOUNT_PATH}`);
        const result = await res.json();
        if (!res.ok || result?.action !== 1) return;
        const remote = result?.data?.currency;
        if (remote && DEFAULT_CURRENCIES.some((c) => c.code === remote)) {
          setCurrencyState(remote as CurrencyCode);
          localStorage.setItem(STORAGE_KEY, remote);
        } else {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local && DEFAULT_CURRENCIES.some((c) => c.code === local)) {
            saveToAccount(local as CurrencyCode);
          }
        }
      } catch {
        // Keep the browser's choice.
      }
    })();
  }, [isAuthenticated, saveToAccount]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
    if (isAuthenticated) saveToAccount(code);
  }, [isAuthenticated, saveToAccount]);

  const formatPrice = useCallback(
    (amount: number, fromCurrency?: string) => {
      let amountInUSD = amount;
      if (fromCurrency && fromCurrency !== "USD") {
        const fromInfo = currencies.find((c) => c.code === fromCurrency);
        if (fromInfo && fromInfo.rate) {
          amountInUSD = amount / fromInfo.rate;
        } else {
          // No rate for this currency: show it as it is rather than relabel it as the selected one.
          return `${fromCurrency} ${amount.toLocaleString("en-US")}`;
        }
      }
      const info = currencies.find((c) => c.code === currency)!;
      const converted = amountInUSD * info.rate;
      const formatted = converted.toLocaleString("en-US", {
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      });

      if (info.code === "USD") return `$${formatted}`;
      if (info.code === "EUR") return `\u20ac${formatted}`;
      return `${info.symbol} ${formatted}`;
    },
    [currency, currencies]
  );

  const currencyId = currencies.find((c) => c.code === currency)?.id;

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice, currencies, currencyId }}
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
