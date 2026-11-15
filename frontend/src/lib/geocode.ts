/**
 * Recherche d'un lieu pour centrer la carte de tracé.
 * - Coordonnées tapées directement (« 3.85, 11.50 ») : aucun appel réseau.
 * - Sinon : Nominatim (OpenStreetMap), d'abord au Cameroun puis partout. Appel seulement à la validation
 *   (pas d'autocomplétion), conformément à la politique d'usage de Nominatim (1 requête par seconde au plus).
 *   Pour un usage intensif en production, NEXT_PUBLIC_GEOCODER_URL peut pointer vers une autre instance compatible.
 */
export interface Place {
  label: string;
  lat: number;
  lon: number;
  zoom: number;
}

const NOMINATIM = process.env.NEXT_PUBLIC_GEOCODER_URL || "https://nominatim.openstreetmap.org/search";
const COORDS = /^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/;

/** Zoom adapté au type de lieu : assez près pour tracer un champ juste après (une commune entière serait trop loin). */
function zoomFor(type: string, cls: string) {
  if (["house", "building", "farm", "farmyard"].includes(type)) return 18;
  if (["hamlet", "isolated_dwelling", "neighbourhood", "quarter", "locality"].includes(type)) return 17;
  if (["village", "suburb"].includes(type)) return 16;
  if (["town", "city"].includes(type)) return 15;
  if (cls === "boundary" || type === "administrative") return 14;
  return 16;
}

async function ask(q: string, lang: string, country?: string): Promise<Place[]> {
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({ q, format: "jsonv2", limit: "5", "accept-language": lang, ...(country ? { countrycodes: country } : {}) }).toString();
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`geocoder ${r.status}`);
  const rows = (await r.json()) as { display_name: string; lat: string; lon: string; type: string; class: string }[];
  return rows.map((x) => ({ label: x.display_name, lat: Number(x.lat), lon: Number(x.lon), zoom: zoomFor(x.type, x.class) }));
}

export async function searchPlace(query: string, lang: string): Promise<Place[]> {
  const m = COORDS.exec(query);
  if (m) {
    const lat = Number(m[1].replace(",", "."));
    const lon = Number(m[2].replace(",", "."));
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return [{ label: `${lat}, ${lon}`, lat, lon, zoom: 17 }];
  }
  const local = await ask(query, lang, "cm");
  return local.length ? local : ask(query, lang);
}
