import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { ConfirmModal } from "@/components/common_components/ConfirmModal";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { ScanButton } from "@/components/ScanButton";
import { TransfersClockButton } from "@/components/transfers/TransfersClockButton";
import { palette } from "@/constants/Colors";
import { listMyBelongings } from "@/src/api/belongings";
import { scanChip } from "@/src/api/endpoints";
import { ApiError } from "@/src/api/client";
import { getUser } from "@/src/auth/session";
import { listIncomingGrants } from "@/src/api/grants";
import { listIncomingTransfers, listOutgoingTransfers } from "@/src/api/transfers";
import { useI18n } from "@/src/i18n/context";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import { setBelongingTransferStatus } from "@/src/state/belongingCache";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [lastChip, setLastChip] = useState<string>("");
  const [mode, setMode] = useState<"idle" | "scanning">("idle");
  const [unregisteredOpen, setUnregisteredOpen] = useState(false);
  const [pendingChipUid, setPendingChipUid] = useState<string>("");
  const [assetsCount, setAssetsCount] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [offlineReason, setOfflineReason] = useState<string>("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [transferCount, setTransferCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const u = await getUser();
      setUserId(u?.id ? String(u.id) : "");
    })();
  }, []);

  const refreshStatus = useCallback(async () => {
    const timeoutMs = 8000;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeoutMs),
    );

    try {
      const res = await Promise.race([listMyBelongings(), timeout]);
      const items = res.data.items ?? [];
      setAssetsCount(items.length);
      setOnline(true);
      setOfflineReason("");
    } catch (e: unknown) {
      // If we can’t reach the server to fetch belongings, treat system as offline.
      setOnline(false);
      setOfflineReason(
        e instanceof Error && e.message === "timeout"
          ? t("home.statusOfflineTimeout")
          : e instanceof Error
            ? e.message
            : t("home.statusOfflineGeneric"),
      );
      // Keep last known assets count if we have one; otherwise show placeholder.
      setAssetsCount((prev) => prev);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void refreshStatus();
      void (async () => {
        const [incR, outR, grantR] = await Promise.allSettled([
          listIncomingTransfers(),
          listOutgoingTransfers(),
          listIncomingGrants(),
        ]);

        let incomingPending = 0;
        if (incR.status === "fulfilled") {
          const reqs = incR.value.data.requests ?? [];
          incomingPending = reqs.filter(
            (r) => (r.status ?? "pending") === "pending",
          ).length;
        }

        let outgoingUnread = 0;
        if (outR.status === "fulfilled") {
          const outgoing = outR.value.data.requests ?? [];
          for (const r of outgoing) {
            const status = (r.status ?? "pending") as string;
            if (status !== "accepted" && status !== "declined") continue;
            setBelongingTransferStatus(r.belongingId, null);
            if (r.seenBySenderAt) continue;
            outgoingUnread += 1;
          }
        }

        let pendingGrants = 0;
        if (grantR.status === "fulfilled") {
          const grants = grantR.value.data.grants ?? [];
          pendingGrants = grants.filter(
            (g) => (g.status ?? "pending") === "pending",
          ).length;
        }

        setTransferCount(incomingPending + outgoingUnread + pendingGrants);
      })();
    }, [refreshStatus]),
  );

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

      // Global check: is this chip already registered (any user)?
      try {
        const res = await scanChip(chipUid);
        setOnline(true);
        const item = (res.data as any)?.item as any;
        const owner = item?.owner ? String(item.owner) : "";
        const id = item?._id ? String(item._id) : "";

        // If it's ours, open details. Otherwise, show scanned details + owner.
        if (id && owner && userId && owner === userId) {
          router.push({ pathname: "/belonging/[id]", params: { id } });
        } else {
          router.push({
            pathname: "/scan/[chipUid]",
            params: { chipUid },
          });
        }
        return;
      } catch (e: unknown) {
        if (e instanceof ApiError && e.status === 404) {
          setPendingChipUid(chipUid);
          setUnregisteredOpen(true);
          return;
        }
        throw e;
      }
    } catch (e: unknown) {
      setOnline(false);
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

      <Modal
        visible={statusOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusOpen(false)}
      >
        <Pressable
          style={styles.statusBackdrop}
          onPress={() => setStatusOpen(false)}
        >
          <Pressable
            style={styles.statusSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.statusTitle}>
              {online === false
                ? t("home.statusOfflineTitle")
                : t("home.statusOnlineTitle")}
            </Text>
            <Text dim style={styles.statusBody}>
              {online === false
                ? offlineReason || t("home.statusOfflineGeneric")
                : t("home.statusOnlineBody")}
            </Text>

            <Pressable
              onPress={() => setStatusOpen(false)}
              style={({ pressed }) => [
                styles.statusOkBtn,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.statusOkText}>{t("home.statusOk")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>
          {t("home.brandKarma")}
          <Text style={[styles.brand, styles.brandAccent]}>
            {t("home.brandLock")}
          </Text>
        </Text>

        <TransfersClockButton
          count={transferCount}
          onPress={() => router.push("/transfers")}
        />
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
          <Text style={styles.footerValue}>
            {assetsCount == null ? "—" : String(assetsCount)}
          </Text>
        </View>

        <View style={styles.footerBlockRight}>
          <Text muted mono style={styles.footerLabel}>
            {t("home.system")}
          </Text>
          <Pressable
            onPress={() => setStatusOpen(true)}
            hitSlop={10}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    online === false ? "rgba(255,90,90,0.95)" : "#39D98A",
                },
              ]}
            />
            <Text style={styles.footerValue}>
              {online === false ? t("home.offline") : t("home.online")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },

  header: { gap: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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

  statusBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  statusSheet: {
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  statusBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  statusOkBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  statusOkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
