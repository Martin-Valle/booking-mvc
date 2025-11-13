// src/services/orders.service.ts
import { api } from "../core/http";
import { auth } from "./auth.service";
import type { CartItem, Order, AppConfig, ServiceKind } from "../models/types";

const USE_MOCK = String(import.meta.env.VITE_AUTH_MOCK) === "1";
const FN_ORDERS = "/.netlify/functions/orders";

/* =========================
 * ======== MOCK ===========
 * ========================= */
const LS_KEY = "orders:v1";
type OrdersByUser = Record<string, Order[]>;

function loadAll(): OrdersByUser {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function saveAll(db: OrdersByUser) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}
function uid() { return Math.random().toString(36).slice(2, 10); }
function orderCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `ORD-${ymd}-${uid().toUpperCase()}`;
}
function userKey(): string {
  const u = auth.user() as any;
  return String(u?.id || u?.email || "anon");
}
function computeBundleDiscount(subtotal: number, items: CartItem[], cfg: AppConfig): number {
  const promo = cfg.bundlePromo;
  if (!promo?.active || !promo.kinds?.length) return 0;
  const kindsInCart = new Set(items.map(i => i.kind as ServiceKind));
  const allRequired = promo.kinds.every(k => kindsInCart.has(k));
  if (!allRequired) return 0;
  const pct = Math.max(0, Math.min(100, promo.discountPercent ?? 0));
  return (subtotal * pct) / 100;
}

/** MOCK: crea y guarda la orden en localStorage */
async function mockCheckout(cart: CartItem[], cfg: AppConfig): Promise<Order> {
  const u = auth.user() as any;
  if (!u) throw new Error("Debes iniciar sesión");

  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const ivaPct = (cfg.iva ?? 0);
  const iva = subtotal * (ivaPct / 100);
  const discount = computeBundleDiscount(subtotal, cart, cfg);
  const total = Math.max(0, subtotal + iva - discount);

  const order: Order = {
    id: uid(),
    code: orderCode(),
    items: cart.map(i => ({ ...i })),
    subtotal,
    tax: iva,
    
    discount,
    total,
    status: "paid",
    createdAt: new Date().toISOString(),
  } as Order;

  const db = loadAll();
  const key = userKey();
  db[key] = db[key] || [];
  db[key].unshift(order);
  saveAll(db);

  window.dispatchEvent(new CustomEvent("order:created", { detail: order }));
  return order;
}

async function mockGetMyOrders(): Promise<Order[]> {
  const db = loadAll();
  return db[userKey()] ?? [];
}

/* =========================================
 * ======= API (Netlify / Backend) =========
 * ========================================= */
async function apiCheckout(cart: CartItem[], _cfg: AppConfig): Promise<Order> {
  // Deja al backend calcular impuestos/desc. si así lo prefieres
  return api<Order>(FN_ORDERS, {
    method: "POST",
    body: JSON.stringify({ items: cart }),
  });
}
async function apiGetMyOrders(): Promise<Order[]> {
  return api<Order[]>(`${FN_ORDERS}?mine=1`, { method: "GET" });
}

/* =========================
 * ===== Public API ========
 * ========================= */
export async function checkout(cart: CartItem[], cfg: AppConfig): Promise<Order> {
  return USE_MOCK ? mockCheckout(cart, cfg) : apiCheckout(cart, cfg);
}

export async function getMyOrders(): Promise<Order[]> {
  return USE_MOCK ? mockGetMyOrders() : apiGetMyOrders();
}

/* (Opcional) helper para Admin en modo MOCK si lo necesitas en algún punto.
   Para Admin real, usa tu services/admin.service.ts */
export async function adminGetUserOrders(userIdOrEmail: string): Promise<Order[]> {
  if (!USE_MOCK) throw new Error("adminGetUserOrders: usa admin.service.ts en modo API");
  const db = loadAll();
  return db[userIdOrEmail] ?? [];
}
