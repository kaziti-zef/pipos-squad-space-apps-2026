/** Langues prises en charge. Le français est la langue par défaut (public : cultivateurs de Yaoundé). */
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Préfixe un chemin interne par la langue : ("en", "/inscription") → "/en/inscription". Les ancres restent telles quelles. */
export function localizeHref(lang: Locale, path: string): string {
  if (!path.startsWith("/")) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Remplace {nom} dans un texte : fmt("Photo {n} sur {total}", { n: 1, total: 4 }). Utilisable côté serveur et client. */
export function fmt(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Retire le préfixe de langue d'un chemin : "/en/inscription" → "/inscription". */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first)) return "/" + rest.join("/");
  return pathname;
}
