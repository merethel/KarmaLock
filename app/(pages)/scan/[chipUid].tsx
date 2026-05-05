import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import { BelongingAttributesCard } from "@/components/features/belonging/BelongingAttributesCard";
import { BelongingHeroCard } from "@/components/features/belonging/BelongingHeroCard";
import { BelongingHeroHeader } from "@/components/features/belonging/BelongingHeroHeader";
import { palette } from "@/constants/Colors";
import type { Belonging } from "@/src/api/belongings";
import { ApiError } from "@/src/api/client";
import { scanChip } from "@/src/api/endpoints";
import { getUser } from "@/src/auth/session";
import { useI18n } from "@/src/i18n/context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_H = 360;

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

function ownerName(owner: unknown): string {
  if (!owner) return "";
  if (typeof owner === "object") {
    const o = owner as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (name) return name;
  }
  return "";
}

function ownerId(owner: unknown): string {
  if (!owner) return "";
  if (typeof owner === "string") return owner;
  if (typeof owner === "object") {
    const o = owner as Record<string, unknown>;
    const id =
      typeof o._id === "string" ? o._id : typeof o.id === "string" ? o.id : "";
    return id ? String(id) : "";
  }
  return "";
}

export default function ScanChipDetailsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ chipUid?: string }>();
  const chipUid = useMemo(
    () => (params.chipUid ? String(params.chipUid) : ""),
    [params.chipUid],
  );

  const scrollY = useRef(new Animated.Value(0)).current;
  const didDismiss = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [item, setItem] = useState<Belonging | null>(null);
  const [rawOwner, setRawOwner] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await scanChip(chipUid);
        const scanned = (res.data as any)?.item as
          | (Belonging & { owner?: unknown })
          | undefined;
        if (!scanned?._id) throw new Error(t("errors.failed"));

        const owner = scanned.owner ?? null;
        const me = await getUser();
        const myId = me?.id ? String(me.id) : "";
        const scannedOwnerId = ownerId(owner);

        // If it’s ours, show the normal details screen (with buttons).
        if (myId && scannedOwnerId && scannedOwnerId === myId) {
          router.replace({
            pathname: "/belonging/[id]",
            params: { id: scanned._id },
          });
          return;
        }

        if (!cancelled) {
          setItem(scanned);
          setRawOwner(owner);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError(t("scan.chipNotRegisteredTitle"));
        } else {
          setError(e instanceof Error ? e.message : t("errors.failed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chipUid, router, t]);

  const photoUri = useMemo(() => normalizePhotoUri(item?.photoUrl), [item]);
  const valueLabel = useMemo(
    () => formatDkk(item?.attributes?.estimatedValueDkk),
    [item],
  );

  const blurOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 30, 140],
        outputRange: [0, 0.15, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const ownerDisplay = useMemo(
    () => ownerName(rawOwner) || t("scan.scannedOwnerUnknown"),
    [rawOwner, t],
  );
  const belongsText = useMemo(
    () => t("scan.belongsTo").replace("{{name}}", ownerDisplay),
    [ownerDisplay, t],
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
          <View style={{ marginTop: 14, width: 220, gap: 10 }}>
            <Button
              title={t("registerFlow.back")}
              onPress={() => router.back()}
            />
          </View>
        </View>
      ) : !item ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t("errors.failed")}</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
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
              <View style={styles.ownerBanner}>
                <Text style={styles.ownerBannerText}>{belongsText}</Text>
              </View>

              <BelongingAttributesCard t={t} item={item} />
            </View>
          </Animated.ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  error: { color: "tomato", fontSize: 14, textAlign: "center" },
  body: {
    paddingHorizontal: 20,
    gap: 14,
    paddingTop: 14,
  },
  ownerBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  ownerBannerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
    lineHeight: 20,
  },
});
