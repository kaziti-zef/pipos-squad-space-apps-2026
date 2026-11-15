"use client";
/**
 * Session côté navigateur pour les écrans connectés : mode (API réelle ou démo), utilisateur,
 * fermes et ferme courante. En mode API, lu via le BFF (/api/v1) qui garde les jetons en cookies httpOnly.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { CROPS } from "@/lib/domain/crops";
import { currentUser, farms as demoFarms } from "@/lib/mocks";
import { FARM_COOKIE } from "./config";
import * as endpoints from "./endpoints";
import type { Farm, Role } from "./types";

interface AppValue {
  /** true : le backend est configuré et toutes les actions passent par l'API. */
  apiEnabled: boolean;
  ready: boolean;
  user: { id: string; full_name: string } | null;
  farms: Farm[];
  farm: Farm | null;
  role: Role | null;
  setFarm: (id: string) => void;
  logout: () => Promise<void>;
  reloadFarms: () => Promise<void>;
  /** Cultures proposées dans les listes : catalogue du backend (GET /crops) pour la région de la ferme. */
  cropIds: string[];
  /** Nom renvoyé par le backend, pour une culture absente du dictionnaire. */
  cropName: (id: string) => string | undefined;
}

const Ctx = createContext<AppValue | null>(null);

function readFarmCookie() {
  return document.cookie.match(new RegExp(`(?:^|; )${FARM_COOKIE}=([^;]+)`))?.[1] ?? null;
}

const STATIC_IDS = CROPS.map((c) => c.id);

const DEMO: Pick<AppValue, "user" | "farms" | "farm" | "role"> = {
  user: { id: currentUser.id, full_name: currentUser.full_name },
  farms: demoFarms as unknown as Farm[],
  farm: demoFarms[0] as unknown as Farm,
  role: "owner",
};

export function AppProvider({ apiEnabled, children }: { apiEnabled: boolean; children: ReactNode }) {
  const router = useRouter();
  const { href } = useI18n();
  const [state, setState] = useState<{ user: AppValue["user"]; farms: Farm[]; farmId: string | null; ready: boolean }>({
    user: null,
    farms: [],
    farmId: null,
    ready: !apiEnabled,
  });

  const [catalog, setCatalog] = useState<{ region: string; crops: { id: string; name: string }[] } | null>(null);

  const reloadFarms = useCallback(async () => {
    const [me, list] = await Promise.all([endpoints.auth.me(), endpoints.farms.list()]);
    const saved = readFarmCookie();
    const farmId = list.farms.find((f) => f.id === saved)?.id ?? list.farms[0]?.id ?? null;
    setState({ user: me, farms: list.farms, farmId, ready: true });
  }, []);

  useEffect(() => {
    if (!apiEnabled) return;
    // Lecture différée : l'état n'est mis à jour qu'à la réponse du serveur.
    const id = setTimeout(() => {
      reloadFarms().catch(() => setState((s) => ({ ...s, ready: true })));
    }, 0);
    return () => clearTimeout(id);
  }, [apiEnabled, reloadFarms]);

  // Catalogue des cultures de la région de la ferme courante (route publique, mise en cache 10 min côté backend).
  const region = state.farms.find((f) => f.id === state.farmId)?.region ?? null;
  useEffect(() => {
    if (!apiEnabled || !region || catalog?.region === region) return;
    let alive = true;
    endpoints.referentiel
      .crops(region)
      .then((r) => alive && setCatalog({ region, crops: r.crops.map((c) => ({ id: c.id, name: c.name })) }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [apiEnabled, region, catalog?.region]);

  const setFarm = useCallback(
    (id: string) => {
      document.cookie = `${FARM_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      setState((s) => ({ ...s, farmId: id }));
      router.refresh();
    },
    [router],
  );

  const logout = useCallback(async () => {
    if (apiEnabled) await endpoints.auth.logout().catch(() => undefined);
    router.push(href("/connexion"));
    router.refresh();
  }, [apiEnabled, href, router]);

  const value = useMemo<AppValue>(() => {
    if (!apiEnabled)
      return {
        apiEnabled,
        ready: true,
        ...DEMO,
        setFarm: () => undefined,
        logout,
        reloadFarms: async () => undefined,
        cropIds: STATIC_IDS,
        cropName: () => undefined,
      };
    const names = new Map(catalog?.crops.map((c) => [c.id, c.name]));
    const farm = state.farms.find((f) => f.id === state.farmId) ?? null;
    return {
      apiEnabled,
      ready: state.ready,
      user: state.user,
      farms: state.farms,
      farm,
      role: farm?.user_role ?? null,
      setFarm,
      logout,
      reloadFarms,
      // Avant la réponse du backend : liste locale sans le plantain (culture pérenne, absente du catalogue de rotation).
      cropIds: catalog?.crops.map((c) => c.id) ?? STATIC_IDS.filter((id) => id !== "plantain"),
      cropName: (id) => names.get(id),
    };
  }, [apiEnabled, state, setFarm, logout, reloadFarms, catalog]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp() doit être utilisé sous <AppProvider>.");
  return v;
}

/** Mode API visible aussi hors des écrans connectés (connexion, inscription). */
const ModeCtx = createContext(false);
export function ApiModeProvider({ apiEnabled, children }: { apiEnabled: boolean; children: ReactNode }) {
  return <ModeCtx.Provider value={apiEnabled}>{children}</ModeCtx.Provider>;
}
export function useApiMode() {
  return useContext(ModeCtx);
}
