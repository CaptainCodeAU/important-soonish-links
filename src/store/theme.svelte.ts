export const themeState = $state({
  reducedMotion: false,
});

const motionQuery = typeof window !== "undefined" && typeof window.matchMedia === "function"
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : null;

if (motionQuery) {
  themeState.reducedMotion = motionQuery.matches;
  motionQuery.addEventListener("change", e => {
    themeState.reducedMotion = e.matches;
  });
}

export function applyTheme(theme: "light" | "dark" | "system"): void {
  if (typeof document === "undefined") return;
  const hasMM = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const isDark = theme === "dark" ||
    (theme === "system" && hasMM && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}
