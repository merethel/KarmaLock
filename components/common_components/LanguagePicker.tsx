import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import { useI18n } from "@/src/i18n/context";
import type { Locale } from "@/src/i18n/types";
import { Pressable, StyleSheet, View } from "react-native";

/** Full-width row (e.g. settings). */
export function LanguageRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected
          ? palette.accentBorderStrong
          : "rgba(255,255,255,0.14)",
        backgroundColor: selected
          ? palette.accentSubtle
          : "rgba(255,255,255,0.03)",
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "800" }}>{label}</Text>
      {selected ? (
        <Text style={{ color: palette.accent, fontWeight: "900" }}>✓</Text>
      ) : null}
    </Pressable>
  );
}

const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  da: "🇩🇰",
};

const A11Y_LABEL: Record<Locale, string> = {
  en: "English",
  da: "Dansk",
};

const LOCALES: readonly Locale[] = ["en", "da"];

/**
 * Compact flag buttons to switch app language (no labels).
 * Use on sign-in and anywhere else the same control is needed.
 */
export function LanguageFlagSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <View style={styles.flagRow}>
      {LOCALES.map((code) => {
        const selected = locale === code;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityLabel={A11Y_LABEL[code]}
            accessibilityState={{ selected }}
            onPress={() => void setLocale(code)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.flagChip,
              {
                borderColor: selected
                  ? palette.accentBorder
                  : "rgba(255,255,255,0.10)",
                backgroundColor: selected
                  ? palette.accentSubtle
                  : "rgba(255,255,255,0.04)",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.flagEmoji}>{FLAG[code]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },
  flagChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  flagEmoji: { fontSize: 22, lineHeight: 26 },
});
