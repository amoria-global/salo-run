"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";
import domTranslationsData from "@/lib/domTranslations.json";

export type LanguageCode = "en" | "fr" | "es" | "rw";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "gb" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "fr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "es" },
  { code: "rw", label: "Kinyarwanda", nativeLabel: "Ikinyarwanda", flag: "rw" },
];

const VALID_CODES = new Set<LanguageCode>(["en", "fr", "es", "rw"]);
const STORAGE_KEY = "connekt-language";
const LEGACY_KEY = "locale";
const COOKIE_NAME = "connekt_locale";

function isValidLang(val: unknown): val is LanguageCode {
  return typeof val === "string" && VALID_CODES.has(val.trim().toLowerCase() as LanguageCode);
}

function readCookieLocale(): LanguageCode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const raw = match?.[1]?.trim().toLowerCase();
  return isValidLang(raw) ? raw : null;
}

function writeCookieLocale(lang: LanguageCode) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (typeof window !== "undefined" && window.location.hostname.endsWith("connekyt.com")) {
    document.cookie = `${COOKIE_NAME}=${lang}; domain=.connekyt.com; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

// ─── Exact translations dictionary (EN -> [FR, ES, RW]) ─────────────────────
const EXACT_DICT: Record<string, [string, string, string]> = domTranslationsData as unknown as Record<string, [string, string, string]>;

const LANG_INDEX: Record<Exclude<LanguageCode, "en">, 0 | 1 | 2> = {
  fr: 0,
  es: 1,
  rw: 2,
};

// Normalized and reverse dictionaries for seamless multi-directional translation
const normalizedDict = new Map<string, [string, string, string]>();
const reverseDict = new Map<string, string>(); // any FR, ES, RW string (lowercase trimmed) -> canonical EN

for (const [enKey, trans] of Object.entries(EXACT_DICT)) {
  const normEn = enKey.trim().toLowerCase();
  normalizedDict.set(normEn, trans);

  for (const t of trans) {
    if (t && typeof t === "string") {
      const normTrans = t.trim().toLowerCase();
      if (normTrans && normTrans !== normEn) {
        reverseDict.set(normTrans, enKey);
      }
    }
  }
}

export function translateDashboardText(raw: string, lang: LanguageCode): string {
  if (!raw) return raw;
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Check for trailing punctuation
  const punctMatch = trimmed.match(/^([^:!?.]+)([:!?.]+)$/);
  const baseTrimmed = punctMatch ? punctMatch[1].trim() : trimmed;
  const suffix = punctMatch ? punctMatch[2] : "";

  // 1. Find canonical English representation
  let enCanonical: string | null = null;
  if (EXACT_DICT[baseTrimmed]) {
    enCanonical = baseTrimmed;
  } else {
    const lower = baseTrimmed.toLowerCase();
    for (const key of Object.keys(EXACT_DICT)) {
      if (key.toLowerCase() === lower) {
        enCanonical = key;
        break;
      }
    }
    if (!enCanonical) {
      enCanonical = reverseDict.get(lower) ?? null;
    }
  }

  if (enCanonical) {
    if (lang === "en") {
      return `${leading}${enCanonical}${suffix}${trailing}`;
    }
    const match = EXACT_DICT[enCanonical] || normalizedDict.get(enCanonical.toLowerCase());
    if (match) {
      return `${leading}${match[LANG_INDEX[lang]]}${suffix}${trailing}`;
    }
  }

  if (lang === "en") return raw;
  const idx = LANG_INDEX[lang];

  // Dynamic patterns
  let m = trimmed.match(/^Currently using (Dark|Light) mode$/i);
  if (m) {
    const isDark = m[1].toLowerCase() === "dark";
    if (lang === "fr") return `${leading}Mode ${isDark ? "sombre" : "clair"} actuellement utilisé${trailing}`;
    if (lang === "es") return `${leading}Usando actualmente el modo ${isDark ? "oscuro" : "claro"}${trailing}`;
    return `${leading}Ubu urimo gukoresha uburyo bw'${isDark ? "umwijima" : "urumuri"}${trailing}`;
  }

  m = trimmed.match(/^(\d+)\s+new$/i);
  if (m) {
    if (lang === "fr") return `${leading}${m[1]} nouveau${Number(m[1]) > 1 ? "x" : ""}${trailing}`;
    if (lang === "es") return `${leading}${m[1]} nuevo${Number(m[1]) > 1 ? "s" : ""}${trailing}`;
    return `${leading}${m[1]} bishya${trailing}`;
  }

  m = trimmed.match(/^Payment required\s*·\s*(.+)$/i);
  if (m) {
    if (lang === "fr") return `${leading}Paiement requis · ${m[1]}${trailing}`;
    if (lang === "es") return `${leading}Pago requerido · ${m[1]}${trailing}`;
    return `${leading}Ubwishyu burakenewe · ${m[1]}${trailing}`;
  }

  m = trimmed.match(/^(Good morning|Good afternoon|Good evening|Welcome back)(,\s*.+)?$/i);
  if (m) {
    const greetEn = m[1];
    const rest = m[2] ?? "";
    const gKey = Object.keys(EXACT_DICT).find((k) => k.toLowerCase() === greetEn.toLowerCase());
    if (gKey) {
      return `${leading}${EXACT_DICT[gKey][idx]}${rest}${trailing}`;
    }
  }

  m = trimmed.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i);
  if (m) {
    if (lang === "fr") return `${leading}Page ${m[1]} sur ${m[2]}${trailing}`;
    if (lang === "es") return `${leading}Página ${m[1]} de ${m[2]}${trailing}`;
    return `${leading}Urupapuro rwa ${m[1]} kuri ${m[2]}${trailing}`;
  }

  return raw;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languages: LanguageOption[];
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "NOSCRIPT", "SVG"]);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const { isAuthenticated, user } = useDashboardAuth();
  const originalTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const originalPlaceholderMapRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const trackedTextNodesRef = useRef<Set<Text>>(new Set());
  const trackedElementsRef = useRef<Set<Element>>(new Set());

  // 1. Initial load from URL param (?lang=), shared cookie, or localStorage
  useEffect(() => {
    let initial: LanguageCode | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get("lang") || params.get("locale"))?.trim().toLowerCase();
      if (isValidLang(q)) {
        initial = q;
      }
    }
    if (!initial) {
      const cookieLang = readCookieLocale();
      if (cookieLang) initial = cookieLang;
    }
    if (!initial && typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (isValidLang(stored)) initial = stored.trim().toLowerCase() as LanguageCode;
    }
    if (initial) {
      setLanguageState(initial);
      localStorage.setItem(STORAGE_KEY, initial);
      localStorage.setItem(LEGACY_KEY, initial);
      writeCookieLocale(initial);
      document.documentElement.lang = initial;
    }
  }, []);

  const getPreferencesBasePath = useCallback(() => {
    const ct = (user?.customerType || "").toUpperCase();
    if (ct === "EVENT_COORDINATOR" || ct === "COORDINATOR") return "/api/remote/coordinator/preferences";
    if (ct === "PHOTOGRAPHER" || ct === "VIDEOGRAPHER") return "/api/remote/photographer/preferences";
    return "/api/remote/customer/preferences";
  }, [user?.customerType]);

  // 2. Sync with backend preferences when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}${getPreferencesBasePath()}`);
        if (!res.ok) return;
        const result = await res.json();
        const remoteLang = result?.data?.language?.trim()?.toLowerCase();
        // Only apply remoteLang if user didn't already pick one in cookie/localStorage on this session
        const cookieLang = readCookieLocale();
        const localLang = localStorage.getItem(STORAGE_KEY);
        if (!cookieLang && !localLang && isValidLang(remoteLang)) {
          setLanguageState(remoteLang);
          localStorage.setItem(STORAGE_KEY, remoteLang);
          localStorage.setItem(LEGACY_KEY, remoteLang);
          writeCookieLocale(remoteLang);
          document.documentElement.lang = remoteLang;
        }
      } catch {
        // Ignore network errors
      }
    })();
  }, [isAuthenticated, user, getPreferencesBasePath]);

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      if (!isValidLang(code)) return;
      setLanguageState(code);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, code);
        localStorage.setItem(LEGACY_KEY, code);
        writeCookieLocale(code);
        document.documentElement.lang = code;
      }
      if (isAuthenticated && user) {
        dashboardAuthFetch(`${getApiUrl()}${getPreferencesBasePath()}/language`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: code }),
        }).catch(() => {});
      }
    },
    [isAuthenticated, user, getPreferencesBasePath]
  );

  // 3. Automatic non-destructive DOM translator for all dashboard pages
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

    const origTextMap = originalTextMapRef.current;
    const origPlaceholderMap = originalPlaceholderMapRef.current;
    const trackedNodes = trackedTextNodesRef.current;
    const trackedEls = trackedElementsRef.current;

    const processTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-translate]")) return;
      const current = node.nodeValue ?? "";
      if (!current.trim()) return;

      let orig = origTextMap.get(node);
      if (orig === undefined) {
        const candidateRw = translateDashboardText(current, "rw");
        if (candidateRw !== current) {
          orig = translateDashboardText(current, "en");
          origTextMap.set(node, orig);
          trackedNodes.add(node);
        } else {
          return;
        }
      }

      const nextVal = translateDashboardText(orig, language);
      if (node.nodeValue !== nextVal) {
        node.nodeValue = nextVal;
      }
    };

    const processElementAttrs = (el: Element) => {
      if (SKIP_TAGS.has(el.tagName) || el.closest("[data-no-translate]")) return;
      const ph = el.getAttribute("placeholder");
      if (ph && ph.trim()) {
        let orig = origPlaceholderMap.get(el);
        if (orig === undefined) {
          if (translateDashboardText(ph, "rw") !== ph) {
            orig = translateDashboardText(ph, "en");
            origPlaceholderMap.set(el, orig);
            trackedEls.add(el);
          }
        }
        if (orig !== undefined) {
          const nextPh = translateDashboardText(orig, language);
          if (el.getAttribute("placeholder") !== nextPh) {
            el.setAttribute("placeholder", nextPh);
          }
        }
      }
    };

    const walk = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let curr: Node | null = walker.currentNode;
      while (curr) {
        if (curr.nodeType === Node.TEXT_NODE) {
          processTextNode(curr as Text);
        } else if (curr.nodeType === Node.ELEMENT_NODE) {
          processElementAttrs(curr as Element);
        }
        curr = walker.nextNode();
      }
    };

    // First re-translate all previously tracked nodes (important when switching back to 'en' or between languages)
    trackedNodes.forEach((node) => {
      if (!node.isConnected) {
        trackedNodes.delete(node);
        return;
      }
      const orig = origTextMap.get(node);
      if (orig !== undefined) {
        const nextVal = language === "en" ? orig : translateDashboardText(orig, language);
        if (node.nodeValue !== nextVal) {
          node.nodeValue = nextVal;
        }
      }
    });
    trackedEls.forEach((el) => {
      if (!el.isConnected) {
        trackedEls.delete(el);
        return;
      }
      const orig = origPlaceholderMap.get(el);
      if (orig !== undefined) {
        const nextPh = language === "en" ? orig : translateDashboardText(orig, language);
        if (el.getAttribute("placeholder") !== nextPh) {
          el.setAttribute("placeholder", nextPh);
        }
      }
    });

    // Walk full document body
    walk(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          processTextNode(m.target as Text);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              processTextNode(n as Text);
            } else if (n.nodeType === Node.ELEMENT_NODE) {
              processElementAttrs(n as Element);
              walk(n);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const t = useCallback(
    (text: string) => translateDashboardText(text, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: SUPPORTED_LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
