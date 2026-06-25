export const themeState = $state({
  reducedMotion: false,
});

// Track the active theme preference so the prefers-color-scheme listener knows
// whether to live-update (only relevant when the user picked "system").
let currentTheme: "light" | "dark" | "system" = "system";

const motionQuery = typeof window !== "undefined" && typeof window.matchMedia === "function"
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : null;

if (motionQuery) {
  themeState.reducedMotion = motionQuery.matches;
  motionQuery.addEventListener("change", e => {
    themeState.reducedMotion = e.matches;
  });
}

const colorSchemeQuery = typeof window !== "undefined" && typeof window.matchMedia === "function"
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;

if (colorSchemeQuery) {
  colorSchemeQuery.addEventListener("change", () => {
    if (currentTheme === "system") applyTheme("system");
  });
}

export function applyTheme(theme: "light" | "dark" | "system"): void {
  currentTheme = theme;
  if (typeof document === "undefined") return;

  // Persist for the synchronous pre-paint check in popup/main.ts (prevents a
  // light->dark flash on open). localStorage is absent in the service worker.
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem("isl_theme", theme); } catch { /* storage disabled */ }
  }

  const hasMM = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const isDark = theme === "dark" ||
    (theme === "system" && hasMM && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}
