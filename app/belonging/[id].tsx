import { BelongingAttributesCard } from "@/components/belonging/BelongingAttributesCard";
import { BelongingHeroCard } from "@/components/belonging/BelongingHeroCard";
import { BelongingHeroHeader } from "@/components/belonging/BelongingHeroHeader";
import { BelongingLogActions } from "@/components/belonging/BelongingLogActions";
import { BelongingPrimaryActions } from "@/components/belonging/BelongingPrimaryActions";
import { GrantAccessModal } from "@/components/belonging/GrantAccessModal";
import { TransferRequestModal } from "@/components/belonging/TransferRequestModal";
import { ActionSheetModal } from "@/components/belonging/ActionSheetModal";
import { Button } from "@/components/common_components/Button";
import { DangerConfirmModal } from "@/components/common_components/DangerConfirmModal";
import { DangerRow } from "@/components/common_components/DangerRow";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { Belonging } from "@/src/api/belongings";
import {
  deleteBelonging,
  getBelonging,
  getBelongingSharing,
  updateBelonging,
} from "@/src/api/belongings";
import { revokeGrant } from "@/src/api/grants";
import { cancelTransfer, listOutgoingTransfers } from "@/src/api/transfers";
import { useI18n } from "@/src/i18n/context";
import {
  getCachedBelonging,
  setBelongingGrantStatus,
  setBelongingTransferStatus,
} from "@/src/state/belongingCache";
import { getUser, type SessionUser } from "@/src/auth/session";
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

function displayName(user?: { name?: string; email?: string } | null): string {
  const n = (user?.name ?? "").trim();
  if (n) return n;
  const e = (user?.email ?? "").trim();
  return e || "—";
}

function initialsFrom(label: string): string {
  const s = (label || "").trim();
  if (!s) return "—";
  const at = s.indexOf("@");
  const base = at > 0 ? s.slice(0, at) : s;
  const parts = base
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return base.slice(0, 2).toUpperCase();
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

function hashToColor(seed: string): { bg: string; border: string } {
  const s = seed || "—";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const colors = [
    { bg: "rgba(120,255,185,0.18)", border: "rgba(120,255,185,0.32)" },
    { bg: "rgba(80,190,255,0.18)", border: "rgba(80,190,255,0.32)" },
    { bg: "rgba(255,196,80,0.18)", border: "rgba(255,196,80,0.32)" },
    { bg: "rgba(255,120,200,0.18)", border: "rgba(255,120,200,0.32)" },
    { bg: "rgba(170,120,255,0.18)", border: "rgba(170,120,255,0.32)" },
  ];
  return colors[h % colors.length]!;
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
  const [unsubscribeOpen, setUnsubscribeOpen] = useState(false);
  const [stolenOpen, setStolenOpen] = useState(false);
  const [markBusy, setMarkBusy] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [pendingOutgoingId, setPendingOutgoingId] = useState<string>("");
  const [grantBusy, setGrantBusy] = useState(false);

  const isGranted = Boolean(item?.accessRole === "granted" && item?.grantId);
  const isOwner = Boolean(item?.accessRole === "owner");
  const [sharingOpen, setSharingOpen] = useState(false);
  const [sharing, setSharing] = useState<{
    ownerUser: { id: string; name: string; email: string } | null;
    sharedWith: Array<{
      user: { id: string; name: string; email: string };
      grantId: string;
      status: string;
    }>;
  } | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

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
      const [res, shareRes] = await Promise.all([
        getBelonging(idStr),
        getBelongingSharing(idStr),
      ]);
      const found = res.data.item ?? null;
      setItem(found);
      setSharing(shareRes.data);
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
        try {
          const u = await getUser();
          setSessionUser(u);
        } catch {
          // ignore
        }
      })();
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
      void (async () => {
        if (!idStr) return;
        try {
          const shareRes = await getBelongingSharing(idStr);
          setSharing(shareRes.data);
          const pending =
            (shareRes.data.sharedWith ?? []).find((x) => x.status === "pending") ??
            null;
          setBelongingGrantStatus(idStr, pending ? "granting" : null);
        } catch {
          // ignore
        }
      })();

    }, [idStr, isGranted, load]),
  );

  const photoUri = useMemo(() => normalizePhotoUri(item?.photoUrl), [item]);
  const valueLabel = useMemo(
    () => formatDkk(item?.attributes?.estimatedValueDkk),
    [item],
  );

  const sharingSummary = useMemo(() => {
    const shared = sharing?.sharedWith ?? [];
    const activeOutgoing = shared.filter((x) => (x.status ?? "pending") === "active");
    const pendingOutgoing = shared.filter((x) => (x.status ?? "pending") === "pending");

    const ownerLabel = isGranted
      ? displayName(item?.ownerUser ?? null)
      : displayName(sessionUser);

    const avatars = [
      { key: "owner", label: ownerLabel, kind: "owner" as const },
      ...activeOutgoing.map((g) => ({
        key: `a:${g.grantId}`,
        label: displayName(g.user ?? null),
        kind: "active" as const,
      })),
      ...pendingOutgoing.map((g) => ({
        key: `p:${g.grantId}`,
        label: displayName(g.user ?? null),
        kind: "pending" as const,
      })),
    ];

    const unique: { key: string; label: string; kind: "owner" | "active" | "pending" }[] =
      [];
    const seen = new Set<string>();
    for (const a of avatars) {
      const k = a.label.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(a);
    }
    return {
      ownerLabel,
      activeCount: activeOutgoing.length,
      pendingCount: pendingOutgoing.length,
      avatars: unique.slice(0, 6),
    };
  }, [isGranted, item?.ownerUser, sessionUser, sharing?.sharedWith]);

  // Always show at least the owner initial in the hero card.
  const shouldShowSharing = Boolean(item);

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

  const onUnsubscribe = useCallback(() => {
    if (!item?.grantId) return;
    setUnsubscribeOpen(true);
  }, [item?.grantId]);
  const onReportStolen = useCallback(async () => {
    if (!item?._id) return;
    if (item.isStolen) {
      // Unmark should be instant (no modal).
      try {
        setMarkBusy(true);
        const res = await updateBelonging(item._id, {
          version: item.version,
          isStolen: false,
        });
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
              <BelongingHeroCard
                t={t}
                item={item}
                valueLabel={valueLabel}
                sharing={
                  {
                    avatars: sharingSummary.avatars.length
                      ? sharingSummary.avatars.map((a) => ({
                          key: a.key,
                          initials: initialsFrom(a.label),
                          dim: a.kind === "pending",
                          ...hashToColor(a.label),
                        }))
                      : [
                          {
                            key: "owner",
                            initials: initialsFrom(sharingSummary.ownerLabel),
                            dim: false,
                            ...hashToColor(sharingSummary.ownerLabel),
                          },
                        ],
                  }
                }
                onPressSharing={() => setSharingOpen(true)}
              />

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

                {!isGranted ? (
                  <DangerRow
                    title={t("vault.deleteBelonging")}
                    subtitle={t("vault.deleteBelongingSubtitle")}
                    onPress={() => setDeleteOpen(true)}
                    marginTop={22}
                  />
                ) : null}

                {isGranted ? (
                  <DangerRow
                    icon="remove-circle-outline"
                    title={t("grants.unsubscribeTitle")}
                    subtitle={t("grants.unsubscribeBody")}
                    onPress={grantBusy ? () => {} : onUnsubscribe}
                    marginTop={!isGranted ? 12 : 22}
                  />
                ) : null}
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
            if (isGranted) return;
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
        visible={unsubscribeOpen}
        onClose={() => setUnsubscribeOpen(false)}
        onConfirm={async () => {
          try {
            if (!item?.grantId) return;
            setGrantBusy(true);
            await revokeGrant(item.grantId);
            router.replace("/vault");
          } catch (e: unknown) {
            Alert.alert(
              t("errors.failed"),
              e instanceof Error ? e.message : t("errors.failed"),
            );
          } finally {
            setGrantBusy(false);
            setUnsubscribeOpen(false);
          }
        }}
        title={t("grants.unsubscribeTitle")}
        body={t("grants.unsubscribeBody")}
        cancelLabel={t("transfers.cancel")}
        confirmLabel={t("grants.unsubscribeConfirm")}
        countdownSeconds={0}
      />

      <DangerConfirmModal
        visible={stolenOpen}
        onClose={() => setStolenOpen(false)}
        onConfirm={async () => {
          try {
            if (!item?._id) return;
            const res = await updateBelonging(item._id, {
              version: item.version,
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

      <ActionSheetModal
        visible={sharingOpen}
        onClose={() => setSharingOpen(false)}
        title=""
        icon={undefined}
      >
        <View style={{ gap: 12 }}>
          <Text style={styles.simpleLine}>
            {t("sharing.ownerLabel")}{" "}
            <Text style={styles.simpleLineStrong}>{sharingSummary.ownerLabel}</Text>
          </Text>

          {(sharing?.sharedWith ?? [])
            .filter((g) => (g.status ?? "pending") === "active")
            .map((g) => {
              const label = displayName(g.user ?? null);
              return (
                <Text key={g.grantId} style={styles.simpleLine}>
                  {t("sharing.sharedWithLabel")}{" "}
                  <Text style={styles.simpleLineStrong}>{label}</Text>
                </Text>
              );
            })}

        </View>
      </ActionSheetModal>
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

  simpleLine: { fontSize: 16, lineHeight: 22, color: "rgba(255,255,255,0.88)" },
  simpleLineStrong: { fontWeight: "900", color: "rgba(255,255,255,0.98)" },

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
