import { palette } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";

type IonName = ComponentProps<typeof Ionicons>["name"];

export function RegisterPrimaryCta({
  label,
  onPress,
  icon = "arrow-forward",
  iconSize = 22,
}: {
  label: string;
  onPress: () => void;
  icon?: IonName;
  iconSize?: number;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={iconSize} color={palette.accent} />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    minHeight: 54,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: palette.accent,
    maxWidth: "100%",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flexShrink: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
