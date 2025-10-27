import type { AppConfig } from "../models/types";
import { api } from "../core/http";

const MOCK = import.meta.env.VITE_AUTH_MOCK === "1";
const KEY = "app_config";

const DEFAULT_CFG: AppConfig = {
  iva: 12,
  bundlePromo: { active: false, discountPercent: 10, kinds: ["hotel", "car"] },
};

export async function getConfig(): Promise<AppConfig> {
  if (MOCK) {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as AppConfig : DEFAULT_CFG;
  }
  return api<AppConfig>("/admin/config", { method: "GET" });
}

export async function saveConfig(cfg: AppConfig): Promise<void> {
  if (MOCK) {
    localStorage.setItem(KEY, JSON.stringify(cfg));
    return;
  }
  await api("/admin/config", { method: "PUT", body: cfg, parseJson: false });
}
