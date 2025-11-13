import type { SearchResult, Restaurant, Hotel } from "../../models/types";

// ------- MOCKS --------
const hotels: (Hotel & { freeCancellation?: boolean; breakfastIncluded?: boolean; distanceCenterKm?: number })[] = [
  { id: "h1", name: "Hotel Sol Andino", city: "Quito",  country: "Ecuador", price: 85, rating: 4.4, photo: "/assets/hotel1.jpg", freeCancellation: true,  breakfastIncluded: true,  distanceCenterKm: 0.8 },
  { id: "h2", name: "Amazon Suites",   city: "Tena",   country: "Ecuador", price: 72, rating: 4.2, photo: "/assets/hotel2.jpg", freeCancellation: false, breakfastIncluded: true,  distanceCenterKm: 1.2 },
];

const cars = [
  { id: "c1", brand: "Kia",       model: "Rio",  pricePerDay: 35, photo: "/assets/car1.jpg", unlimitedKm: true,  automatic: true, city: "Quito",    country: "Ecuador" },
  { id: "c2", brand: "Chevrolet", model: "Onix", pricePerDay: 42, photo: "/assets/car2.jpg", unlimitedKm: false, automatic: true, city: "Madrid",   country: "España"  },
];

const flights = [
  { id: "f1", from: "UIO", to: "MAD", date: "2025-11-12", price: 1172, airline: "Iberia",  nonstop: true  },
  { id: "f2", from: "UIO", to: "BOG", date: "2025-11-12", price: 320,  airline: "Avianca", nonstop: false },
];

const restaurants: Restaurant[] = [
  { id: "r1", name: "Casa Tapas Madrid", city: "Madrid",    country: "España",  pricePerPerson: 18, rating: 4.5, photo: "/assets/rest1.jpg", cuisineTags: ["tapas","española"],       distanceCenterKm: 0.9 },
  { id: "r2", name: "Mar y Brasa",       city: "Barcelona", country: "España",  pricePerPerson: 25, rating: 4.2, photo: "/assets/rest2.jpg", cuisineTags: ["mariscos","mediterránea"], distanceCenterKm: 1.4 },
  { id: "r3", name: "El Rincón Quiteño", city: "Quito",     country: "Ecuador", pricePerPerson: 10, rating: 4.3, photo: "/assets/rest3.jpg", cuisineTags: ["ecuatoriana"],            distanceCenterKm: 1.1 },
];

// ------- IATA → Ciudad/País (para búsquedas por “España”, “Miami”, etc.) -------
const AIRPORTS: Record<string, { city: string; country: string }> = {
  UIO: { city: "Quito",  country: "Ecuador" },
  MAD: { city: "Madrid", country: "España"  },
  BOG: { city: "Bogotá", country: "Colombia"},
};
const iataText = (code: string) => {
  const a = AIRPORTS[code];
  return a ? `${code} ${a.city} ${a.country}` : code;
};

// ------- Exports de detalle -------
export const __mock = { hotels, cars, flights, restaurants };
export const getHotelById       = (id: string) => hotels.find(h => h.id === id) || null;
export const getCarById         = (id: string) => cars.find(c => c.id === id) || null;
export const getFlightById      = (id: string) => flights.find(f => f.id === id) || null;
export const getRestaurantById  = (id: string) => restaurants.find(r => r.id === id) || null;

// ------- Búsqueda -------
export async function mockSearch(q: string): Promise<SearchResult[]> {
  const term = (q ?? "").toLowerCase().trim();

  const H = hotels
    .filter(h => `${h.name} ${h.city} ${h.country ?? ""}`.toLowerCase().includes(term))
    .map(h => ({ kind: "hotel", item: h }) as SearchResult);

  const C = cars
    .filter(c => `${c.brand} ${c.model} ${c.city ?? ""} ${c.country ?? ""}`.toLowerCase().includes(term))
    .map(c => ({ kind: "car", item: c }) as SearchResult);

  const F = flights
    .filter(f => `${iataText(f.from)} ${iataText(f.to)} ${f.airline}`.toLowerCase().includes(term))
    .map(f => ({ kind: "flight", item: f }) as SearchResult);
  const R = restaurants
    .filter(r => `${r.name} ${r.city} ${r.cuisine}`.toLowerCase().includes(term))
    .map(r => ({ kind: "restaurant", item: r }) as SearchResult);

  const R = restaurants
    .filter(r => `${r.name} ${r.city} ${r.country ?? ""} ${(r.cuisineTags ?? []).join(" ")}`.toLowerCase().includes(term))
    .map(r => ({ kind: "restaurant", item: r }) as SearchResult);

  await new Promise(r => setTimeout(r, 300));
  // q vacío → TODO (para Home)
  if (!term) return [...H, ...C, ...F, ...R];
  return [...H, ...C, ...F, ...R];
}
export function getRestaurantById(id: string) {
  return __mock.restaurants.find(r => r.id === id) || null;
}
