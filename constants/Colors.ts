/**
 * KarmaLock design tokens — single source of truth for colors.
 * Import `palette` / `accentAlpha` from here instead of hardcoding hex or rgba.
 */

const ACCENT = "#d4006a";
const ACCENT_R = 0xd4;
const ACCENT_G = 0x00;
const ACCENT_B = 0x6a;

/** `palette.accent` with the given opacity (0–1). */
export function accentAlpha(opacity: number): string {
  return `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${opacity})`;
}

export const palette = {
  text: "#ffffff",
  background: "#000000",

  /** Primary brand: CTAs, links, tint, selection */
  accent: ACCENT,

  /** Navigation / tab active (same as accent; kept explicit for clarity) */
  tint: ACCENT,
  tabIconDefault: "#888888",
  tabIconSelected: ACCENT,

  line: "rgba(255,255,255,0.12)",

  success: "#39D98A",
  warning: "#FFB020",
  danger: "#FF3B30",

  /** Dark magenta surface (e.g. avatar plate on settings) */
  surfaceAccentDark: "#1e0214",

  /** Common accent-tinted UI fills (prefer these over raw rgba in components) */
  accentSubtle: accentAlpha(0.1),
  accentSubtleMid: accentAlpha(0.12),
  accentBorder: accentAlpha(0.45),
  accentBorderStrong: accentAlpha(0.55),
  accentGlow: accentAlpha(0.14),
  accentGlowSoft: accentAlpha(0.04),
  accentSurface: accentAlpha(0.18),
  accentWash: accentAlpha(0.03),
  accentTrack: accentAlpha(0.45),
  selection: accentAlpha(0.9),
} as const;

export type AppPalette = typeof palette;

export default {
  light: palette,
  dark: palette,
};
