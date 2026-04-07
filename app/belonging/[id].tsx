import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import { BelongingAttributesCard } from "@/components/belonging/BelongingAttributesCard";
import { BelongingHeroHeader } from "@/components/belonging/BelongingHeroHeader";
import { BelongingHeroCard } from "@/components/belonging/BelongingHeroCard";
import { BelongingLogActions } from "@/components/belonging/BelongingLogActions";
import { BelongingPrimaryActions } from "@/components/belonging/BelongingPrimaryActions";
import { DangerConfirmModal } from "@/components/common_components/DangerConfirmModal";
import { DangerRow } from "@/components/common_components/DangerRow";
import type { Belonging } from "@/src/api/belongings";
import { deleteBelonging, listMyBelongings } from "@/src/api/belongings";
import { useI18n } from "@/src/i18n/context";
import { useFocusEffect } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
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

  const [item, setItem] = useState<Belonging | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await listMyBelongings();
      const found = (res.data.items || []).find((x) => x._id === id) ?? null;
      setItem(found);
      if (!found) setError(t("errors.failed"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      // Returning from the edit screen should show updated values immediately.
      void load();
    }, [load]),
  );

  const photoUri = useMemo(() => normalizePhotoUri(item?.photoUrl), [item]);
  const valueLabel = useMemo(
    () => formatDkk(item?.attributes?.estimatedValueDkk),
    [item],
  );

  const onTransfer = () => Alert.alert("Transfer", "Not implemented yet.");
  const onGrant = () => Alert.alert("Grant", "Not implemented yet.");
  const onReportStolen = () =>
    Alert.alert("Report stolen", "Not implemented yet.");
  const onTestAlert = () => Alert.alert("Test alert", "Not implemented yet.");
  const onGetReport = () => Alert.alert("Get report", "Not implemented yet.");
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
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <View style={{ marginTop: 14, width: 220 }}>
            <Button title={t("vault.tryAgain")} onPress={load} />
          </View>
        </View>
      ) : !item ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t("errors.failed")}</Text>
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
                  onGrant={onGrant}
                  onReportStolen={onReportStolen}
                />

                <BelongingAttributesCard
                  t={t}
                  item={item}
                  onEdit={() =>
                    router.push((`/belonging/${item._id}/edit` as unknown) as any)
                  }
                />
                <BelongingLogActions
                  t={t}
                  onTestAlert={onTestAlert}
                  onGetReport={onGetReport}
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
    </View>
  );
}

const HERO_H = 360;
const CARD_BG = "rgba(255,255,255,0.06)";

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

});
