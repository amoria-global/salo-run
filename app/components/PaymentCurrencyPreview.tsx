"use client";

/**
 * PaymentCurrencyPreview
 *
 * Compact panel for payment / withdraw modals and wizards. The user picks a
 * preferred display currency and the panel shows every relevant amount on the
 * surface (available balance, amount entered, etc.) converted to that
 * currency. Display-only: the actual submitted amount and currency are
 * unchanged — the backend converts to USD on receipt and to the gateway
 * currency at the XentriPay boundary.
 *
 * Visual: a small card pinned at top-right of the modal body. Pill-shaped
 * selector at the top of the card mirrors the topbar currency switcher
 * (components/topbar.tsx), so the affordance feels familiar across surfaces.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCurrency, type CurrencyCode } from "../context/CurrencyContext";
import { useTheme } from "../context/ThemeContext";

export interface PaymentCurrencyPreviewAmount {
  label: string;
  amount: number;
}

interface PaymentCurrencyPreviewProps {
  /** Currency the input `amount` values are denominated in. */
  fromCurrency: CurrencyCode;
  /** Labelled amounts to convert and display under the selector. */
  amounts: PaymentCurrencyPreviewAmount[];
  /** Optional title for the panel. */
  title?: string;
  /**
   * Notify parent when the user picks a different display currency, so the
   * surrounding modal can also re-render its amounts in that currency if it
   * wants to. Optional — the component works standalone too.
   */
  onCurrencyChange?: (code: CurrencyCode) => void;
}

const PaymentCurrencyPreview: React.FC<PaymentCurrencyPreviewProps> = ({
  fromCurrency,
  amounts,
  title = "View in",
  onCurrencyChange,
}) => {
  const { currencies, currency: globalCurrency } = useCurrency();
  const { colors, actualTheme } = useTheme();

  // Default the panel to whatever currency the user picked in the topbar.
  // Modal-local choice doesn't push back to the global selector — modal
  // selection is a one-off "view what would I pay in X" check.
  const [displayCode, setDisplayCode] = useState<CurrencyCode>(globalCurrency);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayCode(globalCurrency);
  }, [globalCurrency]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fromInfo = currencies.find((c) => c.code === fromCurrency);
  const toInfo = currencies.find((c) => c.code === displayCode);

  const convertedAmounts = useMemo(() => {
    if (!fromInfo || !toInfo) return [];
    const fromRate = fromInfo.rate || 1;
    const toRate = toInfo.rate || 1;
    if (fromRate <= 0 || toRate <= 0) return [];
    return amounts.map(({ label, amount }) => {
      const safe = Number.isFinite(amount) ? amount : 0;
      const usd = safe / fromRate;
      const out = usd * toRate;
      return { label, value: out };
    });
  }, [amounts, fromInfo, toInfo]);

  if (!toInfo) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: toInfo.decimals,
      maximumFractionDigits: toInfo.decimals,
    }).format(n);

  const handlePick = (code: CurrencyCode) => {
    setDisplayCode(code);
    setOpen(false);
    onCurrencyChange?.(code);
  };

  return (
    <div
      ref={rootRef}
      style={{
        // Transparent bg so the panel adopts whatever color the host modal
        // paints it on (balance-card blue, white form bg, dark KYC bg, etc.)
        // instead of imposing its own card color. Border + theme-aware text
        // keep contrast regardless of the backdrop.
        background: "transparent",
        border: `1px solid ${colors.borderPrimary}`,
        borderRadius: "0.75rem",
        padding: "0.75rem",
        minWidth: "200px",
        maxWidth: "260px",
      }}
    >
      {/* Header: title + selector pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.6rem",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: colors.textSecondary,
          }}
        >
          {title}
        </span>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.55rem",
              borderRadius: "9999px",
              border: `2px solid ${colors.borderPrimary}`,
              background: colors.bgTertiary,
              color: colors.textPrimary,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <img
              src={`https://flagcdn.com/w40/${toInfo.flag}.png`}
              alt=""
              style={{ width: "16px", height: "12px", objectFit: "cover", borderRadius: "2px" }}
            />
            {toInfo.code}
            <i
              style={{
                fontSize: "0.55rem",
                color: colors.textSecondary,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
              className="bi bi-chevron-down"
            />
          </button>

          {/*
            Dropdown is anchored to the RIGHT edge of the pill so it grows
            leftward — keeps it inside the parent panel, which itself is
            already anchored at the modal's right edge. That avoids the
            previous "dropdown bleeds past the modal's left edge" issue.
          */}
          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 0.4rem)",
                right: 0,
                backgroundColor: colors.bgSecondary,
                borderRadius: "0.75rem",
                boxShadow: colors.shadowLg,
                border: `2px solid ${colors.borderPrimary}`,
                padding: "0.4rem",
                minWidth: "200px",
                zIndex: 1200,
              }}
            >
              {currencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePick(c.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.45rem 0.7rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background:
                      displayCode === c.code
                        ? actualTheme === "dark"
                          ? "#1E3A5F"
                          : "#EFF6FF"
                        : "transparent",
                    color: colors.textPrimary,
                    fontSize: "0.82rem",
                    fontWeight: displayCode === c.code ? 600 : 400,
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => {
                    if (displayCode !== c.code) e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    if (displayCode !== c.code) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <img
                      src={`https://flagcdn.com/w40/${c.flag}.png`}
                      alt={c.name}
                      style={{ width: "20px", height: "15px", objectFit: "cover", borderRadius: "2px" }}
                    />
                    <span style={{ fontWeight: 600 }}>{c.code}</span>
                    <span style={{ fontSize: "0.78rem", color: colors.textSecondary }}>{c.name}</span>
                  </div>
                  {displayCode === c.code && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke={actualTheme === "dark" ? "#60A5FA" : "#083A85"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body: each labelled amount, converted */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {convertedAmounts.map(({ label, value }, idx) => (
          <div
            key={`${label}-${idx}`}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "0.5rem",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ color: colors.textSecondary }}>{label}</span>
            <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
              {toInfo.symbol}
              {fmt(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentCurrencyPreview;
