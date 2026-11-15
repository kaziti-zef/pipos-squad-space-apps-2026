import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, localizeHref, type Locale } from "./config";
import type { Dictionary } from "./types";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

/** Langue de la requête (segment racine [lang]), sans prop drilling. Composants serveur uniquement. */
export async function getLang(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Dictionnaire de la langue courante + helper de lien localisé. */
export async function getI18n() {
  const l = await getLang();
  const t = await dictionaries[l]();
  return { lang: l, t, href: (path: string) => localizeHref(l, path) };
}

export async function getDictionaryFor(l: Locale) {
  return dictionaries[l]();
}
