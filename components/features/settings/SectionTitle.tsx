import { Text } from "@/components/common_components/Text";
import { StyleSheet } from "react-native";

export function SectionTitle({ label }: { label: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 4,
  },
});
