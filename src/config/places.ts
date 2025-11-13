// src/config/places.ts
export interface Place {
  key: string;            // slug único
  city: string;
  country: string;
  hero?: string;          // opcional: imagen de portada
}

export const PLACES: Place[] = [
  { key: "quito-ec",      city: "Quito",      country: "Ecuador",   hero: "/assets/places/quito.jpg" },
  { key: "guayaquil-ec",  city: "Guayaquil",  country: "Ecuador",   hero: "/assets/places/guayaquil.jpg" },
  { key: "cuenca-ec",     city: "Cuenca",     country: "Ecuador",   hero: "/assets/places/cuenca.jpg" },
  { key: "madrid-es",     city: "Madrid",     country: "España",    hero: "/assets/places/madrid.jpg" },
  { key: "paris-fr",      city: "París",      country: "Francia",   hero: "/assets/places/paris.jpg" },
  { key: "miami-us",      city: "Miami",      country: "EE.UU.",    hero: "/assets/places/miami.jpg" },
];
