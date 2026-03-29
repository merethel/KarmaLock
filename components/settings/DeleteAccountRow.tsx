import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function DeleteAccountRow({ title, subtitle, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.deleteRow, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <Ionicons name="trash-outline" size={22} color="#E57373" />
      <View style={styles.textBlock}>
        <Text style={styles.deleteTitle}>{title}</Text>
        <Text dim style={styles.deleteSub}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(229,115,115,0.35)",
    backgroundColor: "rgba(229,115,115,0.06)",
  },
  textBlock: { flex: 1, marginLeft: 12 },
  deleteTitle: {
    color: "#E57373",
    fontSize: 16,
    fontWeight: "800",
  },
  deleteSub: {
    fontSize: 12,
    marginTop: 4,
  },
});
