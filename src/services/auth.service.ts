import type { AuthUser, Role } from "../models/types";
import { api } from "../core/http";

// Permite forzar mock desde consola: window.__MOCK_AUTH__ = true
declare global { interface Window { __MOCK_AUTH__?: boolean } }

// Lee VITE_AUTH_MOCK o VITE_USE_MOCK; si alguna es "1" -> mock activado
const envMock =
  String((import.meta.env as any).VITE_AUTH_MOCK ?? (import.meta.env as any).VITE_USE_MOCK ?? "").trim();

const MOCK =
  envMock === "1" ||
  (typeof window !== "undefined" && !!window.__MOCK_AUTH__);

const SESSION_KEY = "mock_auth_user";

// Usuarios demo (solo mock)
const MOCK_USERS: Array<{ id: string; name: string; email: string; role: Role; password: string }> = [
  { id: "u1", name: "Admin Demo",   email: "admin@demo.com", role: "admin", password: "123456" },
  { id: "u2", name: "Usuario Demo", email: "user@demo.com",  role: "user",  password: "123456" },
];

type AuthListener = (user: AuthUser | null) => void;

class AuthService {
  private _user: AuthUser | null = null;
  private listeners: Set<AuthListener> = new Set();

  user() { return this._user; }

  onChange(fn: AuthListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this._user);
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: this._user }));
  }

  async bootstrap() {
    if (MOCK) {
      console.info("[auth] MOCK mode ON");
      const cached = sessionStorage.getItem(SESSION_KEY);
      this._user = cached ? (JSON.parse(cached) as AuthUser) : null;
      this.emit();
      return;
    }
    try {
      this._user = await api<AuthUser>("/auth/me", { method: "GET" });
    } catch {
      this._user = null;
    }
    this.emit();
  }

  async login(email: string, password: string) {
    if (MOCK) {
      const found = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) throw new Error("Credenciales inválidas (usa admin@demo.com o user@demo.com con 123456)");
      const { id, name, role } = found;
      this._user = { id, name, email: found.email, role };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._user));
      this.emit();
      return this._user;
    }

    await api("/auth/login", { method: "POST", body: { email, password } });
    this._user = await api<AuthUser>("/auth/me", { method: "GET" });
    this.emit();
    return this._user!;
  }

  async logout() {
    if (MOCK) {
      sessionStorage.removeItem(SESSION_KEY);
      this._user = null;
      this.emit();
      return;
    }
    try {
      await api("/auth/logout", { method: "POST", parseJson: false });
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
