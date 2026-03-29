import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { settingsTheme } from "./theme";

export type SettingsRowIcon = keyof typeof Ionicons.glyphMap;

type Props = {
  icon: SettingsRowIcon;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  chevron?: boolean;
  link?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  chevron,
  link,
  onPress,
  showDivider,
}: Props) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color={settingsTheme.muted} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text dim style={styles.rowSub}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <View style={styles.rowRight}>{right}</View>
      ) : chevron ? (
        <Ionicons name="chevron-forward" size={20} color={settingsTheme.muted} />
      ) : link ? (
        <Ionicons name="open-outline" size={20} color={settingsTheme.muted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          showDivider && styles.rowDivider,
          pressed && { opacity: 0.88 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>{content}</View>
  );
}

/** Use for trailing metadata cells (e.g. version string). */
export const settingsRowStyles = StyleSheet.create({
  valueText: {
    fontSize: 12,
    fontWeight: "600",
    color: settingsTheme.muted,
    textAlign: "right",
    maxWidth: 200,
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowIcon: { width: 36, alignItems: "center" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 13, marginTop: 3 },
  rowRight: { marginLeft: 8 },
});
