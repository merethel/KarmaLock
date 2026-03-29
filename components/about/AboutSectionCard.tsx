import { Text } from "@/components/common_components/Text";
import { settingsTheme } from "@/components/settings/theme";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  sectionTitle: string;
  children: ReactNode;
};

export function AboutSectionCard({ sectionTitle, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>{sectionTitle}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: settingsTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: settingsTheme.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    color: settingsTheme.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 12,
  },
});
