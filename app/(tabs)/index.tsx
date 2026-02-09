import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useTheme } from "@/components/theme";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [lastChip, setLastChip] = useState<string>("");

  async function mockScan() {
    setLoading(true);
    setLastChip("");

    // simulate NFC scan delay
    await new Promise((r) => setTimeout(r, 1200));

    // fake chip uid
    const chipUid = `KL-${Math.floor(Math.random() * 9000 + 1000)}-X`;
    setLastChip(chipUid);

    setLoading(false);
  }

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.background }]}>
      <LoadingOverlay
        visible={loading}
        title="LOCKING..."
        subtitle="VERIFYING NFC SIGNATURE"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text muted mono style={styles.systemReady}>
          SYSTEM READY
        </Text>
        <Text style={styles.brand}>
          KARMA<Text style={[styles.brand, { color: theme.tint }]}>LOCK</Text>
        </Text>
      </View>

      {/* Center scan circle */}
      <View style={styles.center}>
        <Pressable
          onPress={mockScan}
          style={[styles.scanCircle, { borderColor: "rgba(255,255,255,0.16)" }]}
        >
          <Text style={styles.scanText}>SCAN</Text>

          <View style={styles.pill}>
            <Text mono style={styles.pillText}>
              INITIATE // NFC
            </Text>
          </View>
        </Pressable>

        {lastChip ? (
          <Text dim mono style={{ marginTop: 18, letterSpacing: 1.4 }}>
            LAST UID: {lastChip}
          </Text>
        ) : null}
      </View>

      {/* Footer status */}
      <View style={styles.footer}>
        <View style={styles.footerBlock}>
          <Text muted mono style={styles.footerLabel}>
            ASSETS
          </Text>
          <Text style={styles.footerValue}>2</Text>
        </View>

        <View style={styles.footerBlockRight}>
          <Text muted mono style={styles.footerLabel}>
            SYSTEM
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: "#39D98A" }]} />
            <Text style={styles.footerValue}>ONLINE</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 24, paddingHorizontal: 20 },
  header: { gap: 6 },
  systemReady: { letterSpacing: 2, fontSize: 12 },
  brand: { fontSize: 26, fontWeight: "900", letterSpacing: 0.5 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  scanCircle: {
    width: 270,
    height: 270,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  scanText: { fontSize: 64, fontWeight: "900", letterSpacing: 1 },
  pill: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  pillText: { letterSpacing: 2, fontSize: 13 },

  footer: {
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerBlock: { gap: 8 },
  footerBlockRight: { gap: 8, alignItems: "flex-end" },
  footerLabel: { letterSpacing: 2, fontSize: 12 },
  footerValue: { fontSize: 26, fontWeight: "900" },
  dot: { width: 10, height: 10, borderRadius: 999 },
});
