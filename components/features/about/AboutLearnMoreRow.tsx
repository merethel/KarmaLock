import { Text } from "@/components/common_components/Text";
import { settingsTheme } from "@/components/features/settings/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function AboutLearnMoreRow({ icon, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
    >
      <Ionicons name={icon} size={22} color={settingsTheme.accent} />
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="open-outline" size={20} color="rgba(255,255,255,0.55)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: settingsTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: settingsTheme.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
