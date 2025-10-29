// src/services/auth.service.ts
import type { AuthUser, Role } from "../models/types";
import { fnApi } from "../core/http";

declare global {
  interface Window {
    __MOCK_AUTH__?: boolean;
  }
}

/* =======================
   MODO MOCK (sin backend)
   ======================= */
const envMock = String(
  (import.meta.env as any)?.VITE_AUTH_MOCK ??
    (import.meta.env as any)?.VITE_USE_MOCK ??
    ""
).trim();
export const MOCK =
  envMock === "1" ||
  (typeof window !== "undefined" && !!window.__MOCK_AUTH__);

const SESSION_KEY = "mock_auth_user";

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
};

const MOCK_USERS: MockUser[] = [
  { id: "u1", name: "Admin Demo",   email: "admin@demo.com", role: "admin", password: "123456" },
  { id: "u2", name: "Usuario Demo", email: "user@demo.com",  role: "user",  password: "123456" },
];

type MockOrder = {
  id: string;
  userId: string;
  createdAt: string;
  total: number;
  kind: "hotel" | "car" | "flight" | "restaurant";
  refId: string;
  title: string;
  status: "paid" | "pending" | "cancelled";
};

const MOCK_ORDERS: MockOrder[] = [
  { id: "o1", userId: "u2", createdAt: "2025-10-01T10:00:00Z", total: 85,  kind: "hotel",  refId: "h1", title: "Hotel Sol Andino — 1 noche", status: "paid" },
  { id: "o2", userId: "u2", createdAt: "2025-10-05T12:00:00Z", total: 35,  kind: "car",    refId: "c1", title: "Kia Rio — 1 día",            status: "paid" },
  { id: "o3", userId: "u1", createdAt: "2025-10-10T15:00:00Z", total: 320, kind: "flight", refId: "f2", title: "UIO → BOG",                  status: "pending" },
];

/* =============== Utils comunes =============== */

type AuthListener = (user: AuthUser | null) => void;

/** Normaliza el usuario que venga del backend a AuthUser */
function normalizeAuthUser(input: any): AuthUser | null {
  if (!input) return null;
  const u = input.user ?? input; // soporta { user: {...} } o directo

  const id = u.id ?? u.idUsuario ?? u.userId ?? u.uuid ?? null;

  // --- construir nombre sin mezclar ?? y || ---
  let nameCandidate: string | null | undefined;
  if (u.name != null && u.name !== "") {
    nameCandidate = u.name;
  } else if (u.nombre && u.apellido) {
    nameCandidate = `${u.nombre} ${u.apellido}`;
  } else {
    nameCandidate = u.nombre ?? u.fullName;
  }
  const name = (nameCandidate ?? u.email ?? "") as string;
  // -------------------------------------------

  const email = u.email ?? u.correo ?? "";

  let role: Role = (u.role ?? u.rol ?? "user") as Role;
  if (role !== "admin" && role !== "user") role = "user";

  if (!id || !email) return null;
  return { id, name, email, role };
}

/** Llama al primer endpoint que responda (compat: /auth-x y /auth-x con guiones) */
async function callAny<T = any>(paths: string[], init?: any): Promise<T> {
  let lastErr: any;
  for (const p of paths) {
    try {
      return await fnApi<T>(p, init);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/* =============== Servicio principal =============== */

class AuthService {
  private _user: AuthUser | null = null;
  private listeners: Set<AuthListener> = new Set();

  user() {
    return this._user;
  }

  onChange(fn: AuthListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this._user);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth:changed", { detail: this._user })
      );
    }
  }

  async bootstrap() {
    if (MOCK) {
      const cached = sessionStorage.getItem(SESSION_KEY);
      this._user = cached ? (JSON.parse(cached) as AuthUser) : null;

      // compat: si hay usuario mock, asegura token mock
      if (this._user) localStorage.setItem("token", "mock-token");

      this.emit();
      return;
    }
    try {
      const raw = await callAny<any>(["/auth/me", "/auth-me"], { method: "GET" });
      this._user = normalizeAuthUser(raw);
    } catch {
      this._user = null;
    }
    this.emit();
  }

  async login(email: string, password: string) {
    if (MOCK) {
      const found = MOCK_USERS.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );
      if (!found) {
        throw new Error(
          "Credenciales inválidas. Usa admin@demo.com o user@demo.com con 123456."
        );
      }
      const { id, name, role } = found;
      this._user = { id, name, email: found.email, role };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._user));

      // 👇 compat con lógicas antiguas (carrito/checkout mirando 'token')
      localStorage.setItem("token", "mock-token");

      this.emit();
      return this._user;
    }

    await callAny<void>(["/auth/login", "/auth-login"], {
      method: "POST",
      body: { email, password },
    });

    const raw = await callAny<any>(["/auth/me", "/auth-me"], { method: "GET" });
    this._user = normalizeAuthUser(raw);
    this.emit();
    return this._user!;
  }

  async register(payload: {
    name?: string;
    nombre?: string;
    apellido?: string;
    email: string;
    telefono?: string;
    password: string;
  }) {
    if (MOCK) {
      const exists = MOCK_USERS.some(
        (u) => u.email.toLowerCase() === payload.email.toLowerCase()
      );
      if (exists) throw new Error("El email ya existe (mock).");

      const id = `u${MOCK_USERS.length + 1}`;
      const full = [payload.nombre, payload.apellido].filter(Boolean).join(" ");
      const name = payload.name ?? (full || payload.email);

      const created: MockUser = {
        id,
        name,
        email: payload.email,
        role: "user",
        password: payload.password,
      };
      MOCK_USERS.push(created);

      this._user = { id, name, email: created.email, role: "user" };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._user));
      localStorage.setItem("token", "mock-token"); // compat
      this.emit();
      return this._user;
    }

    const raw = await callAny<any>(["/auth/register", "/auth-register"], {
      method: "POST",
      body: payload,
    });

    this._user = normalizeAuthUser(raw) ?? (await this.me());
    this.emit();
    return this._user!;
  }

  async me() {
    if (MOCK) {
      if (!this._user) {
        const cached = sessionStorage.getItem(SESSION_KEY);
        this._user = cached ? (JSON.parse(cached) as AuthUser) : null;
        if (this._user) localStorage.setItem("token", "mock-token"); // compat
      }
      return this._user;
    }
    try {
      const raw = await callAny<any>(["/auth/me", "/auth-me"], { method: "GET" });
      this._user = normalizeAuthUser(raw);
      this.emit();
      return this._user;
    } catch {
      return null;
    }
  }

  async logout() {
    if (MOCK) {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("token"); // compat
      this._user = null;
      this.emit();
      return;
    }
    try {
      await callAny<void>(["/auth/logout", "/auth-logout"], {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } finally {
      this._user = null;
      this.emit();
    }
  }

  requireRole(role: Role) {
    return !!this._user && this._user.role === role;
  }
}

export const auth = new AuthService();

/* ===== Helpers públicos (usados por los controllers) ===== */
export async function authMe() {
  return await auth.me();
}
export async function authLogin(email: string, password: string) {
  return await auth.login(email, password);
}
export async function authLogout() {
  await auth.logout();
}
export async function authRegister(payload: {
  name?: string;
  nombre?: string;
  apellido?: string;
  email: string;
  telefono?: string;
  password: string;
}) {
  return await auth.register(payload);
}
export function isAuthenticated() {
  return !!auth.user();
}

/* ===== REST auxiliares con soporte mock ===== */
export async function myOrders() {
  if (MOCK) {
    const u = auth.user();
    if (!u) return [];
    return MOCK_ORDERS.filter((o) => o.userId === u.id);
  }
  return await fnApi<any[]>("/orders", { method: "GET" });
}
export async function adminUsers() {
  if (MOCK) {
    return MOCK_USERS.map(({ password, ...safe }) => safe);
  }
  return await fnApi<any[]>("/admin-users", { method: "GET" });
}
export async function adminOrdersByUser(userId: string) {
  if (MOCK) {
    return MOCK_ORDERS.filter((o) => o.userId === userId);
  }
  return await fnApi<any[]>("/orders", { method: "GET", params: { userId } });
}

/* ---- Aliases para compatibilidad (si algún archivo usa estos nombres) ---- */
export const login = authLogin;
export const logout = authLogout;
export const register = authRegister;
export const me = authMe;
