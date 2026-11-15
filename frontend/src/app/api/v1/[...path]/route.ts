/**
 * BFF : le navigateur appelle /api/v1/... (même origine) ; ce handler relaie vers le backend AgroRot
 * en ajoutant le jeton lu dans un cookie httpOnly. Cas particuliers :
 *  - auth/login, auth/register : stocke les jetons en cookies, renvoie seulement { user, expires_in } ;
 *  - auth/logout : révoque côté backend puis efface les cookies ;
 *  - auth/refresh : interdit depuis le navigateur (le BFF le fait lui-même) ;
 *  - 401 TOKEN_EXPIRED : UN renouvellement puis rejoue la requête une fois.
 */
import { NextRequest, NextResponse } from "next/server";
import { API_ENABLED, API_URL, effacerJetons, ecrireJetons, lireJetons, renouveler, type Jetons } from "@/lib/api/session.server";

// Pas de `export const dynamic` : incompatible avec cacheComponents ; un handler qui lit la requête est déjà dynamique.
// Durée maximale de la fonction sur Vercel (secondes) : au-delà du délai d'attente du backend (DELAI_LONG).
export const maxDuration = 150;

type Ctx = { params: Promise<{ path: string[] }> };
const TRANSMIS = ["accept-language", "content-type", "if-match", "x-request-id"];
const RENVOYES = ["content-type", "content-disposition", "x-request-id", "retry-after", "etag"];

/**
 * Délai maximal d'attente du backend. Sans lui, un backend lent ou endormi (hébergement gratuit qui se met
 * en veille) laissait les boutons sur « Enregistrement… » sans fin. Le calcul des stratégies et le PDF ont droit
 * à plus de temps. Réglable avec AGROROT_API_TIMEOUT_MS (défaut 45 s, 120 s pour les calculs longs).
 */
const DELAI = Number(process.env.AGROROT_API_TIMEOUT_MS) || 45_000;
const DELAI_LONG = Math.max(DELAI, 120_000);
const delaiPour = (method: string, chemin: string) =>
  (method === "POST" && chemin.endsWith("/strategies")) || chemin.endsWith("export.pdf") ? DELAI_LONG : DELAI;

const MESSAGES = {
  fr: { lent: "Le serveur AgriRot met trop de temps à répondre. Réessayez dans un instant.", injoignable: "Le serveur AgriRot est injoignable. Vérifiez votre connexion ou réessayez plus tard." },
  en: { lent: "The AgriRot server is taking too long to answer. Please try again in a moment.", injoignable: "The AgriRot server cannot be reached. Check your connection or try again later." },
};
const msg = (lang: string) => MESSAGES[lang.startsWith("en") ? "en" : "fr"];
const estDelai = (e: unknown) => e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");

async function relayer(req: NextRequest, chemin: string, corps: ArrayBuffer | undefined, jeton: string | null) {
  const headers = new Headers();
  for (const h of TRANSMIS) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  if (jeton) headers.set("Authorization", `Bearer ${jeton}`);
  return fetch(`${API_URL}/${chemin}${req.nextUrl.search}`, {
    method: req.method, headers, body: corps, cache: "no-store", redirect: "manual",
    signal: AbortSignal.timeout(delaiPour(req.method, chemin)),
  });
}

function versClient(r: Response, corps?: BodyInit | null) {
  const headers = new Headers();
  for (const h of RENVOYES) { const v = r.headers.get(h); if (v) headers.set(h, v); }
  return new NextResponse(corps === undefined ? r.body : corps, { status: r.status, headers });
}

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, details: {}, request_id: "req_bff" } }, { status });
}

async function handler(req: NextRequest, { params }: Ctx) {
  // Mode démo (AGROROT_API_URL non défini) : aucun backend à relayer.
  if (!API_ENABLED) return erreur(503, "DEMO_MODE", "Mode démonstration : aucun serveur AgriRot n'est configuré.");
  const chemin = (await params).path.map(encodeURIComponent).join("/");
  const lang = req.headers.get("accept-language") ?? "fr";
  const corps = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();
  const { access, refresh } = await lireJetons();

  if (chemin === "auth/refresh") return erreur(404, "NOT_FOUND", "Ressource introuvable.");

  if (chemin === "auth/login" || chemin === "auth/register") {
    let r: Response;
    try { r = await relayer(req, chemin, corps, null); }
    catch (e) {
      return estDelai(e) ? erreur(504, "GATEWAY_TIMEOUT", msg(lang).lent) : erreur(503, "ENGINE_UNAVAILABLE", msg(lang).injoignable);
    }
    if (!r.ok) return versClient(r);
    const j = (await r.json()) as Jetons & { user: unknown };
    await ecrireJetons(j);
    return NextResponse.json({ user: j.user, expires_in: j.expires_in }, { status: r.status });
  }

  if (chemin === "auth/logout") {
    if (access && refresh) {
      const h = new Headers({ "Content-Type": "application/json", Authorization: `Bearer ${access}` });
      await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: h, body: JSON.stringify({ refresh_token: refresh }), signal: AbortSignal.timeout(10_000) })
        .catch(() => undefined);
    }
    await effacerJetons();
    return new NextResponse(null, { status: 204 });
  }

  let r: Response;
  try {
    r = await relayer(req, chemin, corps, access);
    if (r.status === 401) {
      const code = await r.clone().json().then((b) => b?.error?.code).catch(() => null);
      // jeton d'accès absent (cookie expiré) ou TOKEN_EXPIRED : un seul renouvellement
      if (code === "TOKEN_EXPIRED" || (!access && refresh)) {
        const neuf = await renouveler(refresh, lang);
        if (neuf) r = await relayer(req, chemin, corps, neuf);
        else await effacerJetons();
      }
    }
  } catch (e) {
    return estDelai(e) ? erreur(504, "GATEWAY_TIMEOUT", msg(lang).lent) : erreur(503, "ENGINE_UNAVAILABLE", msg(lang).injoignable);
  }
  if (r.status === 204) return new NextResponse(null, { status: 204 });
  return versClient(r);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
