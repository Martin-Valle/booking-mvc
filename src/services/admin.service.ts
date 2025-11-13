// src/services/admin.service.ts
const USE_MOCK = String(import.meta.env.VITE_AUTH_MOCK) === "1";
import { api } from "../core/http";
import type { Order } from "./orders.service";

export type AdminUser = {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
};

const FN_USERS = "/.netlify/functions/admin-users";
const FN_ORDERS = "/.netlify/functions/orders";

export async function adminGetUsers(): Promise<AdminUser[]> {
  if (USE_MOCK) {
    const raw = localStorage.getItem("mock:users");
    if (raw) return JSON.parse(raw);
    const seed: AdminUser[] = [
      { id: "u1", nombre: "Usuario", apellido: "Demo", email: "demo@example.com" },
    ];
    localStorage.setItem("mock:users", JSON.stringify(seed));
    return seed;
  }
  return api<AdminUser[]>(FN_USERS, { method: "GET" });
}

export async function adminGetUserOrders(userId: string): Promise<Order[]> {
  if (USE_MOCK) {
    const mapRaw = localStorage.getItem("mock:orders:byUser") || "{}";
    const map = JSON.parse(mapRaw) as Record<string, Order[]>;
    return map[userId] || [];
  }
  return api<Order[]>(`${FN_ORDERS}?user=${encodeURIComponent(userId)}`, { method: "GET" });
}
