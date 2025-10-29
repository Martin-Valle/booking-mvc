// src/core/http.ts  (o https.ts si quieres, pero ajusta los imports)
// ---------------------------------------------------------------

import axios, { AxiosError } from "axios";

/* =========================
   Configuración común
   ========================= */
export const XSRF_COOKIE_NAME = "XSRF-TOKEN";
export const XSRF_HEADER_NAME = "X-XSRF-TOKEN";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/* =========================
   Instancia Axios (API REST)
   ========================= */
export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { Accept: "application/json" },
  xsrfCookieName: XSRF_COOKIE_NAME,
  xsrfHeaderName: XSRF_HEADER_NAME,
});

// Interceptor de respuesta: normaliza errores y emite 401
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    if (status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    const data: any = err.response?.data;
    const message =
      (data && (data.message || data.error || data.detail)) || err.message;
    return Promise.reject(new Error(message));
  }
);

/**
 * api: helper compatible con tu uso previo (similar a fetch-wrapper).
 * Ejemplos:
 *  - api("/auth/me", { method: "GET" })
 *  - api("/auth/login", { method: "POST", body: {email, password} })
 */
export async function api<T = any>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    parseJson?: boolean; // sin uso con axios, queda por compatibilidad
    params?: Record<string, any>;
  } = {}
): Promise<T> {
  const method = opts.method ?? "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  const resp = await http.request<T>({
    url: path,
    method,
    headers,
    // En GET usa params; en otros usa data
    params: method === "GET" ? opts.params ?? opts.body : opts.params,
    data: method !== "GET" ? opts.body : undefined,
  });

  return resp.data as T;
}

/* Helpers opcionales por comodidad (API REST con Axios) */
export const getJSON = <T = any>(url: string, params?: any) =>
  http.get<T>(url, { params }).then((r) => r.data);
export const postJSON = <T = any>(url: string, body?: any) =>
  http.post<T>(url, body).then((r) => r.data);
export const putJSON = <T = any>(url: string, body?: any) =>
  http.put<T>(url, body).then((r) => r.data);
export const delJSON = <T = any>(url: string) =>
  http.delete<T>(url).then((r) => r.data);

/* =========================
   SOAP (cuando toque)
   ========================= */
export async function soapCall(endpoint: string, xmlEnvelope: string) {
  const { data } = await http.post(endpoint, xmlEnvelope, {
    headers: { "Content-Type": "text/xml; charset=UTF-8" },
    transformResponse: (r) => r, // devuelve XML crudo
  });
  return data;
}

/* =======================================================
   Netlify Functions (fetch) - envío de cookies HttpOnly
   ======================================================= */

/** Lee el valor de una cookie no-HttpOnly (para XSRF). */
function readCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]) : null;
}

/** Determina si debemos serializar el body a JSON. */
function shouldJsonifyBody(body: any): boolean {
  if (!body) return false;
  if (typeof body !== "object") return false;
  // No jsonificar si es un tipo especial
  if (body instanceof FormData) return false;
  if (body instanceof Blob) return false;
  if (body instanceof ArrayBuffer) return false;
  if (body instanceof URLSearchParams) return false;
  return true;
}

/** Convierte a querystring (para GET con params). */
function toQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
    else usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

type FnApiInit = RequestInit & {
  /** Prefijo para funciones; por defecto '/.netlify/functions' */
  basePath?: string;
  /** Query params para métodos GET (opcional) */
  params?: Record<string, any>;
};

/**
 * fnApi: helper para llamar Netlify Functions con cookies (JWT HttpOnly).
 * - Usa fetch + credentials: 'include'
 * - Maneja 401 emitiendo 'auth:unauthorized'
 * - Parsea JSON cuando corresponde, soporta 204 y texto plano
 *
 * Ejemplos:
 *  - fnApi("/auth/me")
 *  - fnApi("/orders", { method: "POST", body: { a: 1 } })
 *  - fnApi("/search", { params: { q: "hotel", page: 1 } })
 */
export async function fnApi<T = any>(
  path: string,
  opts: FnApiInit = {}
): Promise<T> {
  const basePath = opts.basePath ?? "/.netlify/functions";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Evita pasar a fetch propiedades que no existen en RequestInit
  const { basePath: _bp, params: _params, ...rest } = opts;
  const method = (rest.method ?? "GET").toUpperCase();

  const url =
    method === "GET" && opts.params
      ? `${basePath}${normalizedPath}${toQuery(opts.params)}`
      : `${basePath}${normalizedPath}`;

  // Construcción de headers (nunca duplicados)
  const headers = new Headers(rest.headers as HeadersInit | undefined);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const bodyNeedsJson = shouldJsonifyBody(rest.body);
  if (bodyNeedsJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // XSRF para fetch (Axios lo hace automático, aquí lo imitamos)
  if (!headers.has(XSRF_HEADER_NAME)) {
    const xsrf = readCookie(XSRF_COOKIE_NAME);
    if (xsrf) headers.set(XSRF_HEADER_NAME, xsrf);
  }

  // Serialización de body si aplica
  const fetchBody =
    bodyNeedsJson || headers.get("Content-Type") === "application/json"
      ? JSON.stringify(rest.body)
      : (rest.body as BodyInit | null | undefined);

  // RequestInit limpio y con una sola aparición de 'headers' y 'body'
  const init: RequestInit = {
    ...rest,               // mode, cache, referrer, etc.
    method,
    credentials: "include",
    headers,               // ← nuestras cabeceras mandan
  };

  // Solo adjuntar body cuando no sea GET/HEAD
  if (!/^(GET|HEAD)$/i.test(method) && fetchBody != null) {
    init.body = fetchBody;
  }

  const res = await fetch(url, init);

  // Parseo robusto de respuesta
  const ct = res.headers.get("content-type") || "";
  let data: any = null;

  if (res.status !== 204) {
    if (ct.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      const txt = await res.text();
      data = txt || null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    const msg =
      (data &&
        typeof data === "object" &&
        (data.error || data.message || data.detail)) ||
      (typeof data === "string" && data) ||
      `${res.status} ${res.statusText || "Error"}`;
    throw new Error(msg);
  }

  return data as T;
}

/* Helpers opcionales por comodidad (Netlify Functions con fetch) */
export const fnGetJSON = <T = any>(
  path: string,
  params?: Record<string, any>,
  init?: Omit<FnApiInit, "method" | "params">
) => fnApi<T>(path, { ...(init || {}), method: "GET", params });

export const fnPostJSON = <T = any>(
  path: string,
  body?: any,
  init?: Omit<FnApiInit, "method" | "body">
) => fnApi<T>(path, { ...(init || {}), method: "POST", body });

export const fnPutJSON = <T = any>(
  path: string,
  body?: any,
  init?: Omit<FnApiInit, "method" | "body">
) => fnApi<T>(path, { ...(init || {}), method: "PUT", body });

export const fnDelJSON = <T = any>(
  path: string,
  init?: Omit<FnApiInit, "method">
) => fnApi<T>(path, { ...(init || {}), method: "DELETE" });
