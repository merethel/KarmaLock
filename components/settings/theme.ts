import { palette } from "@/constants/Colors";

/** Shared tokens for settings screens and settings UI components. */
export const settingsTheme = {
  card: "#121212",
  border: "rgba(255,255,255,0.08)",
  muted: "rgba(255,255,255,0.55)",
  accent: palette.accent,
  avatarBg: palette.surfaceAccentDark,
  avatarLetter: palette.accent,
} as const;
