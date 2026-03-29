import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { ScanButton } from "@/components/ScanButton";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [lastChip, setLastChip] = useState<string>("");
  const [mode, setMode] = useState<"idle" | "scanning">("idle");
  const router = useRouter();

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
    router.push({ pathname: "/add-belonging", params: { chipUid } });
  }

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay
        visible={loading}
        title={t("home.locking")}
        subtitle={t("home.verifyingNfc")}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>
          {t("home.brandKarma")}
          <Text style={[styles.brand, styles.brandAccent]}>
            {t("home.brandLock")}
          </Text>
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
            {t("home.assets")}
          </Text>
          <Text style={styles.footerValue}>2</Text>
        </View>

        <View style={styles.footerBlockRight}>
          <Text muted mono style={styles.footerLabel}>
            {t("home.system")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: "#39D98A" }]} />
            <Text style={styles.footerValue}>{t("home.online")}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },

  header: { gap: 6 },
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
