import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { ConfirmModal } from "@/components/common_components/ConfirmModal";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { ScanButton } from "@/components/ScanButton";
import { palette } from "@/constants/Colors";
import { listMyBelongings } from "@/src/api/belongings";
import { useI18n } from "@/src/i18n/context";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [lastChip, setLastChip] = useState<string>("");
  const [mode, setMode] = useState<"idle" | "scanning">("idle");
  const [unregisteredOpen, setUnregisteredOpen] = useState(false);
  const [pendingChipUid, setPendingChipUid] = useState<string>("");
  const router = useRouter();

  async function onScan() {
    try {
      setLoading(true);
      setMode("scanning");
      setLastChip("");
      setPendingChipUid("");
      setUnregisteredOpen(false);

      const chipUid = await scanChipUid({
        iosAlertMessage: t("scan.iosAlertMessage"),
        nfcUnavailable: t("scan.nfcUnavailable"),
        nfcNotSupported: t("scan.nfcNotSupported"),
        noChipIdFound: t("scan.noChipIdFound"),
      });
      setLastChip(chipUid);

      // If it’s already registered, open details. Otherwise, ask to register.
      const res = await listMyBelongings();
      const items = res.data.items ?? [];
      const found = items.find((it) => it.chipUid === chipUid);
      if (found?._id) {
        router.push({ pathname: "/belonging/[id]", params: { id: found._id } });
      } else {
        setPendingChipUid(chipUid);
        setUnregisteredOpen(true);
      }
    } catch (e: unknown) {
      Alert.alert(
        t("errors.failed"),
        e instanceof Error ? e.message : t("errors.failed"),
      );
    } finally {
      setLoading(false);
      setMode("idle");
    }
  }

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay
        visible={loading}
        title={t("scan.scanningTitle")}
        subtitle={t("scan.scanningSubtitle")}
      />

      <ConfirmModal
        visible={unregisteredOpen}
        onClose={() => setUnregisteredOpen(false)}
        onConfirm={() => {
          setUnregisteredOpen(false);
          if (!pendingChipUid) return;
          router.push({ pathname: "/add-belonging", params: { chipUid: pendingChipUid } });
        }}
        title={t("scan.chipNotRegisteredTitle")}
        body={t("scan.chipNotRegisteredBody")}
        cancelLabel={t("scan.chipNotRegisteredCancel")}
        confirmLabel={t("scan.chipNotRegisteredConfirm")}
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
        <ScanButton mode={mode} onPress={onScan} />
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
  brandAccent: { color: palette.accent },

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
