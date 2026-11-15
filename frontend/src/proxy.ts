import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";

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

/** Redirige toute URL sans langue (/inscription) vers /fr/… ou /en/… (guide Next.js « Internationalization »). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (isLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Ni les fichiers internes de Next, ni les images, ni les fichiers avec extension (favicon.ico…).
  matcher: ["/((?!_next|api|images|.*\\..*).*)"],
};
