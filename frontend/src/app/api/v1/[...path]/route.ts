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

type Ctx = { params: Promise<{ path: string[] }> };
const TRANSMIS = ["accept-language", "content-type", "if-match", "x-request-id"];
const RENVOYES = ["content-type", "content-disposition", "x-request-id", "retry-after", "etag"];

async function relayer(req: NextRequest, chemin: string, corps: ArrayBuffer | undefined, jeton: string | null) {
  const headers = new Headers();
  for (const h of TRANSMIS) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  if (jeton) headers.set("Authorization", `Bearer ${jeton}`);
  return fetch(`${API_URL}/${chemin}${req.nextUrl.search}`, {
    method: req.method, headers, body: corps, cache: "no-store", redirect: "manual",
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
    catch { return erreur(503, "ENGINE_UNAVAILABLE", "Service momentanément indisponible."); }
    if (!r.ok) return versClient(r);
    const j = (await r.json()) as Jetons & { user: unknown };
    await ecrireJetons(j);
    return NextResponse.json({ user: j.user, expires_in: j.expires_in }, { status: r.status });
  }

  if (chemin === "auth/logout") {
    if (access && refresh) {
      const h = new Headers({ "Content-Type": "application/json", Authorization: `Bearer ${access}` });
      await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: h, body: JSON.stringify({ refresh_token: refresh }) })
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
  } catch {
    return erreur(503, "ENGINE_UNAVAILABLE", "Le serveur AgroRot est injoignable.");
  }
  if (r.status === 204) return new NextResponse(null, { status: 204 });
  return versClient(r);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
