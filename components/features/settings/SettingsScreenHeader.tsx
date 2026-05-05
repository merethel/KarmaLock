import { Text } from "@/components/common_components/Text";
import { StyleSheet } from "react-native";

export function SettingsScreenHeader({ title }: { title: string }) {
  return (
    <Text mono style={styles.headerTitle}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 20,
    color: "rgba(255,255,255,0.92)",
  },
});
