import { Text } from "@/components/common_components/Text";
import { settingsTheme } from "@/components/settings/theme";
import { StyleSheet, View } from "react-native";

type Props = { items: string[] };

export function AboutBulletList({ items }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((line, i) => (
        <View key={`${i}-${line}`} style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.text}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: settingsTheme.accent,
    marginTop: 7,
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
});
