export type ServiceKind = "hotel" | "car" | "flight" | "restaurant";
export type Role = "user" | "admin";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country?: string;   // ✅ nuevo
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
  city?: string;
  country?: string;
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
  country?: string;   // ✅ nuevo
  pricePerPerson: number;
  rating: number;
  photo: string;
  cuisineTags?: string[];
  distanceCenterKm?: number;
}
export type SearchResult = {
  kind: ServiceKind;
  item: Hotel | Car | Flight | Restaurant;
};

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
  kinds: ServiceKind[]; // ["hotel","car","flight","restaurant"]
  priceMin?: number; // aplica a todos
  priceMax?: number;
  ratingMin?: number; // hoteles/restaurantes
  city?: string; // hoteles/restaurantes (contiene)
  cuisine?: string; // 🔥 nuevo filtro opcional para restaurantes
  sort?: SortKey;
}


export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface BundlePromo {
  active: boolean;
  discountPercent: number; // 0..100
  kinds: ServiceKind[];    // p.ej. ["hotel","car"]
}

export interface AppConfig {
  iva: number;             // 0..100
  bundlePromo?: BundlePromo;
}