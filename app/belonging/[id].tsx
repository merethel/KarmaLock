import { BackButton } from "@/components/common_components/BackButton";
import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { Belonging } from "@/src/api/belongings";
import { listMyBelongings } from "@/src/api/belongings";
import { useI18n } from "@/src/i18n/context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
  Image,
  Pressable,
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

function Pill({
  label,
  icon,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.pill}>
      {icon ? (
        <Ionicons name={icon} size={14} color="rgba(255,255,255,0.9)" />
      ) : null}
      <Text mono style={styles.pillText}>
        {label}
      </Text>
    </View>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  const v = (value ?? "").trim();
  return (
    <View style={styles.specRow}>
      <Text mono style={styles.specLabel}>
        {label}
      </Text>
      <Text style={styles.specValue} numberOfLines={2}>
        {v || "—"}
      </Text>
    </View>
  );
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
            <View
              style={[
                styles.heroBg,
                { top: -insets.top, height: HERO_H + insets.top },
              ]}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={[styles.heroImage, { height: HERO_H + insets.top }]}
                />
              ) : (
                <View
                  style={[
                    styles.heroPlaceholder,
                    { height: HERO_H + insets.top },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={34}
                    color="rgba(255,255,255,0.25)"
                  />
                </View>
              )}

              <Animated.View
                style={[styles.heroBlur, { opacity: blurOpacity }]}
              >
                <BlurView
                  intensity={42}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>

              <LinearGradient
                colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.80)"]}
                locations={[0.2, 1]}
                style={styles.heroFade}
              />
            </View>

            <View style={styles.heroTopLeft}>
              <BackButton
                onPress={() => router.back()}
                topInset={insets.top + 8}
              />
            </View>

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
              <View style={styles.heroCard}>
                <Text mono style={styles.idLine}>
                  ID // {item.chipUid}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.heroPills}>
                  <Pill
                    label={
                      item.isStolen
                        ? t("vault.statusStolen")
                        : t("vault.statusOk")
                    }
                  />
                  <Pill label={valueLabel} icon="cash-outline" />
                </View>
              </View>

              <View style={styles.body}>
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={onTransfer}
                    style={[styles.actionBtn, styles.primaryBtn]}
                  >
                    <Text style={styles.primaryBtnText}>TRANSFER</Text>
                  </Pressable>
                  <Pressable
                    onPress={onGrant}
                    style={[styles.actionBtn, styles.secondaryBtn]}
                  >
                    <Text style={styles.secondaryBtnText}>GRANT</Text>
                  </Pressable>
                </View>

                <Pressable onPress={onReportStolen} style={styles.reportBtn}>
                  <Text style={styles.reportBtnText}>REPORT STOLEN</Text>
                </Pressable>

                <View style={styles.card}>
                  <Spec label={t("registerFlow.sumBrand")} value={item.brand} />
                  <Spec label={t("registerFlow.sumModel")} value={item.model} />
                  <Spec label={t("registerFlow.sumColor")} value={item.color} />
                  <Spec
                    label={t("registerFlow.sumType")}
                    value={item.category}
                  />
                  <Spec
                    label={t("registerFlow.sumSerial")}
                    value={item.serialNumber}
                  />
                </View>
                <Pressable onPress={onTestAlert} style={styles.testBtn}>
                  <Text style={styles.testBtnText}>TEST ALERT SYSTEM</Text>
                </Pressable>

                <View style={styles.logHeader}>
                  <Text style={styles.logTitle}>LOG</Text>
                  <View style={styles.logActions}>
                    <Pressable onPress={onGetReport} style={styles.smallPill}>
                      <Text style={styles.smallPillText}>GET REPORT</Text>
                    </Pressable>
                    <Pressable onPress={onAddDoc} style={styles.smallPillDark}>
                      <Text style={styles.smallPillDarkText}>+ ADD DOC</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Animated.ScrollView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const HERO_H = 360;
const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.10)";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  error: { color: "tomato", textAlign: "center" },

  heroBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    overflow: "hidden",
    backgroundColor: CARD_BG,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD_BG,
  },
  heroBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  heroTopLeft: {
    position: "absolute",
    top: 0,
    left: 16,
    zIndex: 10,
  },

  heroCard: {
    marginHorizontal: 20,
    marginTop: -72,
    padding: 18,
    gap: 10,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  idLine: { color: "rgba(255,255,255,0.78)", letterSpacing: 2, fontSize: 14 },
  heroTitle: {
    color: "rgba(255,255,255,0.98)",
    fontWeight: "900",
    fontSize: 32,
    letterSpacing: 0.2,
  },
  heroPills: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pillText: {
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 1.4,
    fontSize: 14,
    fontWeight: "900",
  },

  body: { paddingHorizontal: 20, paddingTop: 18, gap: 14 },

  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  primaryBtnText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  secondaryBtnText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },

  reportBtn: {
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 75, 160, 0.85)",
    backgroundColor: "rgba(255, 75, 160, 0.06)",
  },
  reportBtnText: {
    color: "rgba(255, 75, 160, 0.95)",
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 14,
  },

  testBtn: {
    marginTop: 54,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  testBtnText: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 12,
  },

  logHeader: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logTitle: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.2,
    fontSize: 14,
  },
  logActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  smallPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  smallPillText: {
    color: "rgba(0,0,0,0.9)",
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 11,
  },
  smallPillDark: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  smallPillDarkText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 11,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 12,
    marginTop: 6,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  specLabel: {
    width: 120,
    fontSize: 14,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.75)",
  },
  specValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
});
