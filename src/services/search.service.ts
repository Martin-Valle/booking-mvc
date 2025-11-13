import { mockSearch } from "./adapters/mock.adapter";
import type {
  FilterState,
  SearchResult,
  Hotel,
  Car,
  Flight,
  Restaurant,
  ServiceKind,
} from "../models/types";

const ALL_KINDS: ServiceKind[] = ["hotel", "car", "flight", "restaurant"];

function normKinds(k?: ServiceKind[]): ServiceKind[] {
  if (!Array.isArray(k) || k.length === 0) return ALL_KINDS;
  const set = new Set<ServiceKind>();
  for (const v of k) {
    if ((ALL_KINDS as readonly string[]).includes(v)) set.add(v);
  }
  return set.size ? Array.from(set) : ALL_KINDS;
}

function priceOf(r: SearchResult): number {
  switch (r.kind) {
    case "hotel":      return (r.item as Hotel).price;
    case "car":        return (r.item as Car).pricePerDay;
    case "flight":     return (r.item as Flight).price;
    case "restaurant": return (r.item as Restaurant).pricePerPerson;
  }
}

function ratingOf(r: SearchResult): number | undefined {
  if (r.kind === "hotel")      return (r.item as Hotel).rating;
  if (r.kind === "restaurant") return (r.item as Restaurant).rating;
  return undefined;
}

export async function searchAll(q: string, f?: FilterState): Promise<SearchResult[]> {
  let list = await mockSearch(q); // ya filtra por texto/IATA

  if (!f) return list;

  // 1) Tipos (siempre aplicar; si vienen vacíos, usar los 4)
  const kinds = normKinds(f.kinds);
  list = list.filter(r => kinds.includes(r.kind));

  // 2) Precio
  if (typeof f.priceMin === "number") list = list.filter(r => priceOf(r) >= f.priceMin!);
  if (typeof f.priceMax === "number") list = list.filter(r => priceOf(r) <= f.priceMax!);

  // 3) Ciudad (Hoteles / Restaurantes / Autos)
  if (f.city && f.city.trim()) {
    const term = f.city.toLowerCase();
    list = list.filter((r) => {
      if (r.kind === "hotel") {
        const h = r.item as Hotel;
        return `${h.city} ${h.country ?? ""}`.toLowerCase().includes(term);
      }
      if (r.kind === "restaurant") {
        const res = r.item as Restaurant;
        return `${res.city} ${res.country ?? ""}`.toLowerCase().includes(term);
      }
      if (r.kind === "car") {
        const c = r.item as Car;
        return `${c.city ?? ""} ${c.country ?? ""}`.toLowerCase().includes(term);
      }
      return true; // vuelos por q/IATA
    });
  }

  // 4) Rating mínimo (hoteles/restaurantes)
  if (typeof f.ratingMin === "number" && f.ratingMin > 0) {
    list = list.filter((r) => {
      const val = ratingOf(r);
      return val == null ? true : val >= f.ratingMin!;
    });
  }

  // 5) Orden
  switch (f.sort) {
    case "price-asc":
      list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-desc":
      list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "rating-desc":
      list = [...list].sort((a, b) => (ratingOf(b) ?? -Infinity) - (ratingOf(a) ?? -Infinity));
      break;
    default:
      // relevancia => orden del adapter
      break;
  }

  return list;
}
