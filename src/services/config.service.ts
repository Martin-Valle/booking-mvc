// src/services/config.service.ts
import type { AppConfig } from "../models/types";
import { api } from "../core/http";

export type RuntimeConfig = AppConfig & {
  /** IVA en fracción 0..1 para cálculos en UI */
  taxRate: number;
  /** Política de checkout */
  requireLoginForCheckout: boolean;
};

/** Defaults que cumplen con AppConfig */
const DEFAULT_APP_CONFIG: AppConfig = {
  iva: 15, // 15%
  // si tu AppConfig tiene más campos obligatorios, añádelos aquí
} as AppConfig;

const DEFAULT_RUNTIME: Pick<RuntimeConfig, "taxRate" | "requireLoginForCheckout"> = {
  taxRate: (DEFAULT_APP_CONFIG.iva ?? 15) / 100,
  requireLoginForCheckout: true,
};

/** Clave para overrides locales (parche offline/dev) */
const LS_KEY = "admin:config:overrides";

let cached: RuntimeConfig | null = null;

/* ----------------- helpers ----------------- */
function resolveEndpoints(): string[] {
  const env = import.meta.env || {};
  return [
    env.VITE_CONFIG_URL as string | undefined, // explícito
    env.VITE_API_BASE_URL ? `${env.VITE_API_BASE_URL}/admin/config` : undefined,
    env.VITE_ESB_BASE_URL ? `${env.VITE_ESB_BASE_URL}/admin/config` : undefined,
    "/.netlify/functions/admin-config", // Netlify (dev/prod)
    "/config.json", // público (Vite dev o estático)
  ].filter(Boolean) as string[];
}

function readLocalOverride(): any {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalOverride(cfg: AppConfig | null) {
  if (!cfg) localStorage.removeItem(LS_KEY);
  else localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

/** merge superficial + merge profundo de bundlePromo */
function mergeAppConfig(base: AppConfig, ov: Partial<AppConfig>): AppConfig {
  const merged: any = { ...base, ...(ov || {}) };
  if (base.bundlePromo || (ov as any)?.bundlePromo) {
    const bpBase = base.bundlePromo ?? {};
    const bpOv = (ov as any)?.bundlePromo ?? {};
    merged.bundlePromo = { ...bpBase, ...bpOv };
  }
  return merged as AppConfig;
}

/** Normaliza valores (iva entero 0..100, bundlePromo bien formado) */
function normalizeAppConfig(raw: AppConfig): AppConfig {
  const out: any = { ...raw };
  const ivaNum = Math.round(Number(out.iva ?? 0));
  out.iva = Math.max(0, Math.min(100, Number.isFinite(ivaNum) ? ivaNum : 0));

  const bp = out.bundlePromo ?? {};
  const pct = Math.round(Number(bp.discountPercent ?? 0));
  out.bundlePromo = {
    active: !!bp.active,
    discountPercent: Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0)),
    kinds: Array.isArray(bp.kinds) ? bp.kinds : [],
  };
  return out as AppConfig;
}

/* ----------------- API pública ----------------- */

/** Config unificada para la app (con taxRate y requireLoginForCheckout) */
export async function loadConfig(force = false): Promise<RuntimeConfig> {
  if (cached && !force) return cached;

  const endpoints = resolveEndpoints();

  // 1) intenta leer remoto
  let remote: any = null;
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      remote = await r.json();
      console.info("[config] loaded from", url);
      break;
    } catch (err) {
      console.warn("[config] failed:", url, err);
    }
  }

  // 2) base = defaults + remoto
  const base: AppConfig = normalizeAppConfig(
    mergeAppConfig(DEFAULT_APP_CONFIG, remote || {})
  );

  // 3) aplica override local (parche) y normaliza
  const ov = readLocalOverride();
  const mixed: AppConfig = normalizeAppConfig(mergeAppConfig(base, ov));

  // 4) runtime
  const taxRate =
    typeof remote?.taxRate === "number"
      ? remote.taxRate
      : typeof mixed.iva === "number"
      ? mixed.iva / 100
      : DEFAULT_RUNTIME.taxRate;

  const requireLoginForCheckout =
    typeof ov?.requireLoginForCheckout === "boolean"
      ? ov.requireLoginForCheckout
      : typeof remote?.requireLoginForCheckout === "boolean"
      ? remote.requireLoginForCheckout
      : DEFAULT_RUNTIME.requireLoginForCheckout;

  cached = { ...mixed, taxRate, requireLoginForCheckout };
  return cached;
}

/** Devuelve tu AppConfig (sin campos runtime extra) */
export async function getConfig(): Promise<AppConfig> {
  const { taxRate, requireLoginForCheckout, ...rest } = await loadConfig();
  return rest as AppConfig;
}

/** Guardado contra backend real; si falla, guarda override local (parche). */
export async function saveConfig(cfg: AppConfig): Promise<void> {
  try {
    await api("/admin/config", {
      method: "PUT",
      body: JSON.stringify(cfg),
      parseJson: false,
    });
    // si el PUT funcionó, borramos override local
    writeLocalOverride(null);
    console.info("[config] saved to backend");
  } catch (err) {
    // sin backend: persistimos override local
    writeLocalOverride(cfg);
    console.warn("[config] backend save failed; stored local override", err);
  } finally {
    // invalida caché y notifica
    cached = null;
    window.dispatchEvent(new CustomEvent("config:changed"));
  }
}

/** Si necesitas forzar la recarga desde fuera. */
export function clearConfigCache() {
  cached = null;
}
  