import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function DangerRow({
  icon = "trash-outline",
  title,
  subtitle,
  onPress,
  marginTop = 20,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
  marginTop?: number;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { marginTop },
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color="#E57373" />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text dim style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(229,115,115,0.35)",
    backgroundColor: "rgba(229,115,115,0.06)",
  },
  textBlock: { flex: 1, marginLeft: 12 },
  title: {
    color: "#E57373",
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});

