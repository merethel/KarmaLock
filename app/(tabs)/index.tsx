import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { ScanButton } from "@/components/ScanButton";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [lastChip, setLastChip] = useState<string>("");
  const [mode, setMode] = useState<"idle" | "scanning">("idle");

  async function mockScan() {
    setLoading(true);
    setMode("scanning");
    setLastChip("");

    // simulate NFC scan delay
    await new Promise((r) => setTimeout(r, 1200));

    // fake chip uid
    const chipUid = `KL-${Math.floor(Math.random() * 9000 + 1000)}-X`;
    setLastChip(chipUid);

    setLoading(false);
    setMode("idle");
  }

  return (
    <Screen style={styles.screen}>
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
          KARMA<Text style={[styles.brand, styles.brandAccent]}>LOCK</Text>
        </Text>
      </View>

      {/* Center scan button */}
      <View style={styles.center}>
        <ScanButton mode={mode} onPress={mockScan} />
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
  brandAccent: { color: "#FF2DAA" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  lastUid: { marginTop: 18, letterSpacing: 1.4 },

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
