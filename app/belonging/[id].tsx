import { BelongingAttributesCard } from "@/components/belonging/BelongingAttributesCard";
import { BelongingHeroCard } from "@/components/belonging/BelongingHeroCard";
import { BelongingHeroHeader } from "@/components/belonging/BelongingHeroHeader";
import { BelongingLogActions } from "@/components/belonging/BelongingLogActions";
import { BelongingPrimaryActions } from "@/components/belonging/BelongingPrimaryActions";
import { GrantAccessModal } from "@/components/belonging/GrantAccessModal";
import { TransferRequestModal } from "@/components/belonging/TransferRequestModal";
import { Button } from "@/components/common_components/Button";
import { DangerConfirmModal } from "@/components/common_components/DangerConfirmModal";
import { DangerRow } from "@/components/common_components/DangerRow";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { Belonging } from "@/src/api/belongings";
import {
  deleteBelonging,
  listMyBelongings,
  updateBelonging,
} from "@/src/api/belongings";
import { cancelTransfer, listOutgoingTransfers } from "@/src/api/transfers";
import { useI18n } from "@/src/i18n/context";
import {
  getCachedBelonging,
  setBelongingTransferStatus,
} from "@/src/state/belongingCache";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function normalizePhotoUri(photoUrl?: string): string {
  const v = (photoUrl ?? "").trim();
  if (!v) return "";
  if (v.startsWith("data:image/")) return v;
  if (v.startsWith("http")) return v;
  return `data:image/jpeg;base64,${v}`;
}

function formatDkk(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.round(value).toLocaleString(undefined)} DKK`;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d]/g, "");
    if (!cleaned) return "—";
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n).toLocaleString(undefined)} DKK`;
  }
  return "—";
}

export default function BelongingDetailsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const didDismiss = useRef(false);

  const idStr = typeof id === "string" ? id : "";
  const cached = useMemo(
    () => (idStr ? getCachedBelonging(idStr) : null),
    [idStr],
  );
  const [item, setItem] = useState<Belonging | null>(() => cached);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState("");
  const [transferredAway, setTransferredAway] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stolenOpen, setStolenOpen] = useState(false);
  const [markBusy, setMarkBusy] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [pendingOutgoingId, setPendingOutgoingId] = useState<string>("");

  // If the route param arrives after first render, paint from cache immediately.
  useEffect(() => {
    if (!cached) return;
    setItem((prev) => prev ?? cached);
    setLoading(false);
  }, [cached]);

  const load = useCallback(async () => {
    try {
      setError("");
      setTransferredAway(false);
      // If we already have something to render (from cache), refresh silently.
      if (!item) setLoading(true);
      const res = await listMyBelongings();
      const found = (res.data.items || []).find((x) => x._id === idStr) ?? null;
      setItem(found);
      if (!found) setTransferredAway(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      if (!item) setLoading(false);
    }
  }, [idStr, item, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      // Returning from the edit screen should show updated values immediately.
      void load();
      void (async () => {
        if (!idStr) return;
        try {
          const out = await listOutgoingTransfers();
          const reqs = out.data.requests ?? [];
          const pending =
            reqs.find(
              (r) =>
                r.belongingId === idStr && (r.status ?? "pending") === "pending",
            ) ?? null;
          setPendingOutgoingId(pending?._id ?? "");
          setBelongingTransferStatus(idStr, pending ? "transferring" : null);
        } catch {
          // ignore (don't block item details)
        }
      })();
    }, [load]),
  );

  const photoUri = useMemo(() => normalizePhotoUri(item?.photoUrl), [item]);
  const valueLabel = useMemo(
    () => formatDkk(item?.attributes?.estimatedValueDkk),
    [item],
  );

  const onTransfer = () => {
    setTransferOpen(true);
  };
  const onCancelTransfer = useCallback(() => {
    if (!pendingOutgoingId || !idStr) return;
    Alert.alert(t("transfers.cancelRequestTitle"), t("transfers.cancelRequestBody"), [
      { text: t("transfers.cancel"), style: "cancel" },
      {
        text: t("transfers.cancelRequestConfirm"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setCancelBusy(true);
              await cancelTransfer(pendingOutgoingId);
              setPendingOutgoingId("");
              setBelongingTransferStatus(idStr, null);
            } catch (e: unknown) {
              Alert.alert(
                t("errors.failed"),
                e instanceof Error ? e.message : t("errors.failed"),
              );
            } finally {
              setCancelBusy(false);
            }
          })();
        },
      },
    ]);
  }, [idStr, pendingOutgoingId, t]);
  const onGrant = () => setGrantOpen(true);
  const onReportStolen = useCallback(async () => {
    if (!item?._id) return;
    if (item.isStolen) {
      // Unmark should be instant (no modal).
      try {
        setMarkBusy(true);
        const res = await updateBelonging(item._id, { isStolen: false });
        setItem(res.data.item);
      } catch (e: unknown) {
        Alert.alert(
          t("errors.failed"),
          e instanceof Error ? e.message : t("errors.failed"),
        );
      } finally {
        setMarkBusy(false);
      }
      return;
    }
    setStolenOpen(true);
  }, [item?._id, item?.isStolen, t]);
  const onAddDoc = () => Alert.alert("Add doc", "Not implemented yet.");

  const onDelete = useCallback(async () => {
    if (!item?._id) return;
    await deleteBelonging(item._id);
    router.back();
  }, [item?._id, router]);

  const blurOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 30, 140],
        outputRange: [0, 0.15, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const pullDown = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-140, 0, 1],
        outputRange: [140, 0, 0],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const sheetScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-140, 0],
        outputRange: [0.94, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const sheetRadius = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-140, 0],
        outputRange: [28, 0],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const backdropOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-140, 0],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.accent} />
          <Text dim style={{ marginTop: 12 }}>
            {t("vault.loading")}
          </Text>
        </View>
      ) : transferredAway ? (
        <View style={styles.center}>
          <View style={styles.transferredCard}>
            <Ionicons
              name="swap-horizontal"
              size={28}
              color="rgba(255,255,255,0.65)"
            />
            <Text style={styles.transferredTitle}>
              {t("vault.transferredAwayTitle")}
            </Text>
            <Text dim style={styles.transferredBody}>
              {t("vault.transferredAwayBody")}
            </Text>
            <View style={{ marginTop: 14, width: 220 }}>
              <Button
                title={t("vault.goBackToVault")}
                onPress={() => router.replace("/vault")}
              />
            </View>
          </View>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <View style={{ marginTop: 14, width: 220, gap: 10 }}>
            <Button title={t("vault.tryAgain")} onPress={load} />
            <Button
              title={t("registerFlow.back")}
              variant="outline"
              onPress={() => router.replace("/vault")}
            />
          </View>
        </View>
      ) : !item ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t("errors.failed")}</Text>
          <View style={{ marginTop: 14, width: 220, gap: 10 }}>
            <Button title={t("vault.tryAgain")} onPress={load} />
            <Button
              title={t("registerFlow.back")}
              variant="outline"
              onPress={() => router.replace("/vault")}
            />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: "#000",
                opacity: backdropOpacity,
              },
            ]}
          />

          <Animated.View
            style={[
              { flex: 1, overflow: "hidden" },
              {
                transform: [{ translateY: pullDown }, { scale: sheetScale }],
                borderRadius: sheetRadius,
              },
            ]}
          >
            <BelongingHeroHeader
              topInset={insets.top}
              height={HERO_H}
              photoUri={photoUri}
              blurOpacity={blurOpacity}
              onBack={() => router.back()}
            />

            <Animated.ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"
              bounces
              alwaysBounceVertical
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false },
              )}
              onScrollEndDrag={(e) => {
                if (didDismiss.current) return;
                const y = e.nativeEvent.contentOffset.y;
                // Pull down past the top to dismiss.
                if (y < -80) {
                  didDismiss.current = true;
                  router.back();
                }
              }}
              contentContainerStyle={{
                paddingTop: HERO_H - 40,
                paddingBottom: 120,
              }}
            >
              <BelongingHeroCard t={t} item={item} valueLabel={valueLabel} />

              <View style={styles.body}>
                <BelongingPrimaryActions
                  t={t}
                  onTransfer={onTransfer}
                  onCancelTransfer={onCancelTransfer}
                  onGrant={onGrant}
                  onReportStolen={onReportStolen}
                  transferPending={Boolean(pendingOutgoingId)}
                  transferBusy={cancelBusy}
                  stolen={Boolean(item?.isStolen)}
                  reportBusy={markBusy}
                />

                <BelongingAttributesCard
                  t={t}
                  item={item}
                  onEdit={() =>
                    router.push(`/belonging/${item._id}/edit` as unknown as any)
                  }
                />
                <BelongingLogActions
                  t={t}
                  onShowHistory={() =>
                    router.push(
                      `/belonging/${item._id}/history` as unknown as any,
                    )
                  }
                  onAddDoc={onAddDoc}
                />

                <DangerRow
                  title={t("vault.deleteBelonging")}
                  subtitle={t("vault.deleteBelongingSubtitle")}
                  onPress={() => setDeleteOpen(true)}
                  marginTop={22}
                />
              </View>
            </Animated.ScrollView>
          </Animated.View>
        </View>
      )}

      <DangerConfirmModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await onDelete();
          } catch (e: unknown) {
            Alert.alert(
              t("errors.failed"),
              e instanceof Error ? e.message : t("errors.failed"),
            );
          } finally {
            setDeleteOpen(false);
          }
        }}
        title={t("vault.deleteBelongingModalTitle")}
        body={t("vault.deleteBelongingModalBody")}
        cancelLabel={t("vault.deleteBelongingModalCancel")}
        confirmLabel={t("vault.deleteBelongingModalConfirm")}
        waitLabel={(s) =>
          t("vault.deleteBelongingModalWait").replace("{{seconds}}", String(s))
        }
      />

      <DangerConfirmModal
        visible={stolenOpen}
        onClose={() => setStolenOpen(false)}
        onConfirm={async () => {
          try {
            if (!item?._id) return;
            const res = await updateBelonging(item._id, {
              isStolen: !item.isStolen,
            });
            setItem(res.data.item);
          } catch (e: unknown) {
            Alert.alert(
              t("errors.failed"),
              e instanceof Error ? e.message : t("errors.failed"),
            );
          } finally {
            setStolenOpen(false);
          }
        }}
        title={
          item?.isStolen
            ? t("vault.markNotStolenModalTitle")
            : t("vault.reportStolenModalTitle")
        }
        body={
          item?.isStolen
            ? t("vault.markNotStolenModalBody")
            : t("vault.reportStolenModalBody")
        }
        cancelLabel={
          item?.isStolen
            ? t("vault.markNotStolenModalCancel")
            : t("vault.reportStolenModalCancel")
        }
        confirmLabel={
          item?.isStolen
            ? t("vault.markNotStolenModalConfirm")
            : t("vault.reportStolenModalConfirm")
        }
        countdownSeconds={0}
      />

      <TransferRequestModal
        visible={transferOpen}
        item={item}
        onClose={() => setTransferOpen(false)}
      />

      <GrantAccessModal
        visible={grantOpen}
        item={item}
        onClose={() => setGrantOpen(false)}
      />
    </View>
  );
}

const HERO_H = 360;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  error: { color: "tomato", textAlign: "center" },

  body: { paddingHorizontal: 20, paddingTop: 18, gap: 14 },

  transferredCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
    alignItems: "center",
  },
  transferredTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
  transferredBody: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
});
