import { Text } from "@/components/common_components/Text";
import { settingsTheme } from "@/components/features/settings/theme";
import { StyleSheet, View } from "react-native";

type Step = { title: string; body: string };

type Props = { steps: Step[] };

export function AboutNumberedList({ steps }: Props) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, i) => (
        <View key={`step-${i}`} style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{i + 1}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{step.title}</Text>
            <Text dim style={styles.desc}>
              {step.body}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: settingsTheme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  body: { flex: 1, paddingTop: 2 },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
