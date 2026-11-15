import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";
import { ACCESS_COOKIE, API_ENABLED, REFRESH_COOKIE } from "@/lib/api/config";
import { demanderRenouvellement } from "@/lib/api/refresh";

/** Langue préférée : choix mémorisé (cookie), sinon en-tête Accept-Language du navigateur, sinon français. */
function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((r) => (LOCALES as readonly string[]).includes(r.lang));
  return (match?.lang as Locale) ?? DEFAULT_LOCALE;
}

/** Écrans réservés aux personnes connectées (groupe de routes (app)). */
const PRIVATE = ["/tableau-de-bord", "/parcelles", "/ferme"];
/** Écrans de connexion : une personne déjà connectée est renvoyée au tableau de bord. */
const AUTH_PAGES = ["/connexion", "/inscription"];

const SECURE = process.env.NODE_ENV === "production";
const REFRESH_MAX_AGE = 60 * 60 * 24 * Number(process.env.AGROROT_REFRESH_DAYS ?? 7);

/**
 * Session (seulement si AGROROT_API_URL est défini ; en mode démo tout reste ouvert) :
 * - page privée sans jeton d'accès mais avec jeton de renouvellement : on renouvelle AVANT le rendu,
 *   pour que les Server Components lisent un jeton valide ;
 * - page privée sans session : redirection vers /{lang}/connexion?next=… ;
 * - connexion / inscription avec session : redirection vers le tableau de bord.
 */
async function guard(request: NextRequest, lang: Locale, rest: string) {
  const isPrivate = PRIVATE.some((p) => rest === p || rest.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(rest);
  if (!isPrivate && !isAuthPage) return;

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (isAuthPage) {
    if (access) return NextResponse.redirect(new URL(`/${lang}/tableau-de-bord`, request.url));
    return;
  }
  if (access) return;

  if (refresh) {
    const jetons = await demanderRenouvellement(refresh, lang);
    if (jetons) {
      // Le rendu de CETTE requête doit déjà voir le nouveau jeton : on réécrit l'en-tête Cookie en amont.
      request.cookies.set(ACCESS_COOKIE, jetons.access_token);
      if (jetons.refresh_token) request.cookies.set(REFRESH_COOKIE, jetons.refresh_token);
      const headers = new Headers(request.headers);
      headers.set("cookie", request.cookies.toString());
      const res = NextResponse.next({ request: { headers } });
      const base = { httpOnly: true, secure: SECURE, sameSite: "lax" as const, path: "/" };
      res.cookies.set(ACCESS_COOKIE, jetons.access_token, { ...base, maxAge: jetons.expires_in });
      if (jetons.refresh_token) res.cookies.set(REFRESH_COOKIE, jetons.refresh_token, { ...base, maxAge: REFRESH_MAX_AGE });
      return res;
    }
  }

  const login = new URL(`/${lang}/connexion`, request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  const res = NextResponse.redirect(login);
  if (refresh) res.cookies.delete(REFRESH_COOKIE);
  return res;
}

/** Redirige toute URL sans langue (/inscription) vers /fr/… ou /en/… (guide Next.js « Internationalization »). */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (!isLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  if (!API_ENABLED) return;
  return guard(request, first, pathname.slice(first.length + 1) || "/");
}

export const config = {
  // Ni les fichiers internes de Next, ni le BFF (/api), ni les images, ni les fichiers avec extension.
  matcher: ["/((?!_next|api|images|.*\\..*).*)"],
};
