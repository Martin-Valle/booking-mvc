import axios, { AxiosError } from "axios";

// Base URL (usa la variable que tengas disponible)
const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

// Instancia Axios con cookies (sesión via cookie HTTP-Only)
export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { Accept: "application/json" },
  xsrfCookieName: "XSRF-TOKEN",   // ajusta si tu backend usa otros nombres
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// Interceptor de respuesta: normaliza errores y avisa 401
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

/* Helpers opcionales por comodidad */
export const getJSON = <T = any>(url: string, params?: any) =>
  http.get<T>(url, { params }).then((r) => r.data);
export const postJSON = <T = any>(url: string, body?: any) =>
  http.post<T>(url, body).then((r) => r.data);
export const putJSON = <T = any>(url: string, body?: any) =>
  http.put<T>(url, body).then((r) => r.data);
export const delJSON = <T = any>(url: string) =>
  http.delete<T>(url).then((r) => r.data);

/* SOAP (cuando toque) */
export async function soapCall(endpoint: string, xmlEnvelope: string) {
  const { data } = await http.post(endpoint, xmlEnvelope, {
    headers: { "Content-Type": "text/xml; charset=UTF-8" },
    transformResponse: (r) => r, // devuelve XML crudo
  });
  return data;
}
