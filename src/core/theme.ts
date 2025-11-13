import heroHome from "../assets/hero-home.png";
import heroResults from "../assets/hero-results.png";

export function initThemeAssets() {
  const root = document.documentElement;
  root.style.setProperty("--hero-home", `url(${heroHome})`);
  root.style.setProperty("--hero-results", `url(${heroResults})`);
}
