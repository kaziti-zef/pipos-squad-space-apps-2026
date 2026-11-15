"use client";

import { createContext, useContext, type ReactNode } from "react";
import { localizeHref, type Locale } from "./config";
import type { Dictionary } from "./types";

interface I18nValue {
  lang: Locale;
  t: Dictionary;
  href: (path: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Fournit la langue et le dictionnaire aux composants client (posé une fois dans app/[lang]/layout.tsx). */
export function I18nProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ lang, t: dict, href: (path) => localizeHref(lang, path) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé sous <I18nProvider>");
  return ctx;
}
