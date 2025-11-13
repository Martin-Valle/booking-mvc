// src/core/hero.ts
const HOME_IMAGES: Record<string, string[]> = {
  es: [
    "/assets/countries/spain-home-1.jpg",
    "/assets/countries/spain-home-2.jpg",
  ],
  ec: [
    "/assets/countries/ecuador-home-1.jpg",
    "/assets/countries/ecuador-home-2.jpg",
  ],
  fr: [
    "/assets/countries/france-home-1.jpg",
    "/assets/countries/france-home-2.jpg",
  ],
  default: ["/assets/hero.jpg"],
};

const RESULTS_IMAGES: Record<string, string[]> = {
  es: [
    "/assets/countries/spain-results-1.jpg",
    "/assets/countries/spain-results-2.jpg",
  ],
  ec: [
    "/assets/countries/ecuador-results-1.jpg",
    "/assets/countries/ecuador-results-2.jpg",
  ],
  fr: [
    "/assets/countries/france-results-1.jpg",
    "/assets/countries/france-results-2.jpg",
  ],
  default: ["/assets/hero.jpg"],
};

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Elimina acentos y pasa todo a minúsculas
}

function detectKey(text: string): keyof typeof HOME_IMAGES {
  const t = normalize(text);
  // España
  if (/(espan(a|ia)|spain|madrid|barcelona|sevilla)/.test(t)) return "es";
  // Ecuador
  if (/(ecuador|quito|guayaquil|cuenca)/.test(t)) return "ec";
  // Francia
  if (/(francia|paris)/.test(t)) return "fr";
  return "default";
}

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function setHomeHeroByText(text: string) {
  const key = detectKey(text);
  const url = pick(HOME_IMAGES[key] ?? HOME_IMAGES.default);
  document.documentElement.style.setProperty("--hero-home", `url('${url}')`);
}

export function setResultsHeroByText(text: string) {
  const key = detectKey(text);
  const url = pick(RESULTS_IMAGES[key] ?? RESULTS_IMAGES.default);
  document.documentElement.style.setProperty("--hero-results", `url('${url}')`);
}
