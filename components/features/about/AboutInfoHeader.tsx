import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  onBack: () => void;
};

export function AboutInfoHeader({ title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.side}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  side: { flex: 1 },
  title: {
    flex: 2,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#fff",
  },
});
