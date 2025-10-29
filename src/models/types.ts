// src/models/types.ts

export type ServiceKind = "hotel" | "car" | "flight" | "restaurant";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  price: number;
  rating: number;
  photo: string;
}
export interface Car {
  id: string;
  brand: string;
  model: string;
  pricePerDay: number;
  photo: string;
}
export interface Flight {
  id: string;
  from: string;
  to: string;
  date: string;
  price: number;
  airline: string;
}
export interface Restaurant {
  id: string;
  name: string;
  city: string;
  price: number;
  rating: number;
  photo: string;
  cuisine: string;
  description?: string;
  policies?: string;
  rules?: string;
  tipo?: string;
  capacidad?: number;
}

export type SearchResult = { kind: ServiceKind; item: Hotel | Car | Flight | Restaurant };

export interface CartItem {
  kind: ServiceKind;
  id: string;
  title: string;
  subtitle?: string;
  qty: number;
  price: number; // unit
  photo?: string;
}

export type SortKey = "price-asc" | "price-desc" | "rating-desc";

export interface FilterState {
  kinds: ServiceKind[];
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  city?: string;
  sort?: SortKey;
}

/* ========= Usuarios / Auth ========= */
export type Role = "admin" | "user";
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface AuthCredentials {
  email: string;
  password: string;
}
export interface AuthRegisterPayload {
  name?: string;
  nombre?: string;
  apellido?: string;
  email: string;
  telefono?: string;
  password: string;
}

/* ========= Pedidos ========= */
export type OrderStatus = "paid" | "pending" | "cancelled";
export interface Order {
  id: string;
  createdAt: string;  // ISO
  total: number;
  status: OrderStatus;
  title?: string;
  kind?: ServiceKind;
  refId?: string;
  userId?: string;    // útil en admin
}
