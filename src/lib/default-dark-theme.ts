// src/lib/default-dark-theme.ts
// This file exports the default color values for the dark theme.
// It acts as a single source of truth for the dark mode color scheme,
// mirroring the values in globals.css for server-side logic and fallbacks.

export const defaultDarkColorsForTheme = {
  background: "#09090B", // slate-950
  foreground: "#FAFAFA", // zinc-50
  card: "#09090B",
  cardForegroundColor: "#FAFAFA",
  popover: "#09090B",
  popoverForegroundColor: "#FAFAFA",
  primary: "#3B82F6", // blue-500
  primaryForegroundColor: "#FAFAFA",
  secondary: "#1E293B", // slate-800
  secondaryForegroundColor: "#FAFAFA",
  muted: "#1E293B",
  mutedForegroundColor: "#64748B", // slate-500
  accent: "#1E293B",
  accentForegroundColor: "#FAFAFA",
  destructive: "#7F1D1D", // red-900
  destructiveForegroundColor: "#FAFAFA",
  border: "#1E293B",
  input: "#1E293B",
  ring: "#3B82F6",
};
