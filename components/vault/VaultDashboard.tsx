import { Button } from "@/components/common_components/Button";
import { RegisterPrimaryCta } from "@/components/common_components/RegisterPrimaryCta";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { formatVaultSyncLabel } from "@/components/vault/formatSyncLabel";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette } from "@/constants/Colors";
import type { Belonging } from "@/src/api/belongings";
import { listMyBelongings } from "@/src/api/belongings";
import { useI18n } from "@/src/i18n/context";
import { cacheBelonging, seedBelongingCache } from "@/src/state/belongingCache";

const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.10)";
const LOAD_STALL_MS = 30_000;

export default function VaultDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Belonging[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  const [search, setSearch] = useState("");
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    try {
      setLoading(true);
      setError("");
      setLoadTimedOut(false);
      const res = await listMyBelongings();
      if (seq !== loadSeq.current) return;
      const next = res.data.items || [];
      setItems(next);
      seedBelongingCache(next);
      setLastSyncAt(new Date());
    } catch (e: unknown) {
      if (seq !== loadSeq.current) return;
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "";
      setError(msg || t("errors.loadBelongingsFailed"));
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    if (!loading) {
      setLoadTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadTimedOut(true), LOAD_STALL_MS);
    return () => clearTimeout(timer);
  }, [loading, loadAttempt]);

  const retryLoad = useCallback(() => {
    setLoadAttempt((a) => a + 1);
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Keep “Synced just now / X min ago” fresh.
  useEffect(() => {
    const id = setInterval(() => setSyncTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const hay =
        `${i.title} ${i.description ?? ""} ${i.chipUid}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const protectedCount = useMemo(
    () => items.filter((i) => !i.isStolen).length,
    [items],
  );
  const stolenCount = useMemo(
    () => items.filter((i) => i.isStolen).length,
    [items],
  );

  const totalValueDkk = useMemo(() => {
    return items.reduce((sum, i) => {
      const raw = i.attributes?.estimatedValueDkk;
      if (raw == null || raw === "") return sum;
      if (typeof raw === "number" && Number.isFinite(raw)) return sum + raw;
      if (typeof raw === "string") {
        // Integers only (registration enforces digits-only).
        const cleaned = raw.replace(/[^\d]/g, "");
        if (!cleaned) return sum;
        const n = Number(cleaned);
        return Number.isFinite(n) ? sum + n : sum;
      }
      return sum;
    }, 0);
  }, [items]);

  const totalValueLabel = useMemo(() => {
    const n = Math.round(totalValueDkk);
    // If no items have a value, keep the dash.
    return n > 0 ? n.toLocaleString(undefined) : "—";
  }, [totalValueDkk]);

  const syncLabel = useMemo(
    () => formatVaultSyncLabel(lastSyncAt, t),
    [lastSyncAt, t, syncTick],
  );
  const countLabel = t("vault.itemsCount").replace(
    "{{count}}",
    String(items.length),
  );

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        bounces
        alwaysBounceVertical
        onScrollEndDrag={(e) => {
          // Some layouts prevent native pull-to-refresh from triggering reliably.
          // If user pulls down while already at top, refresh anyway.
          if (refreshing || loading) return;
          const y = e.nativeEvent.contentOffset.y;
          if (y < -30) void onRefresh();
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.pageTitle}>{t("vault.simpleTitle")}</Text>
              <View style={styles.pageSubRow}>
                <Text dim style={styles.pageSub}>
                  {countLabel}
                  {" · "}
                  {t("vault.syncedPrefix")} {syncLabel}
                </Text>
              </View>
            </View>

            <VaultStatCards
              protectedCount={protectedCount}
              stolenCount={stolenCount}
              valueLabel={totalValueLabel}
              t={t}
            />

            <VaultSearch value={search} onChangeText={setSearch} t={t} />

            {items.length > 0 ? (
              <View style={styles.addWrap}>
                <Button
                  title={t("vault.addNew")}
                  variant="outline"
                  onPress={() => router.push("/add-belonging")}
                />
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={palette.accent} />
              <Text dim style={{ marginTop: 12 }}>
                {t("vault.loading")}
              </Text>
              {loadTimedOut ? (
                <>
                  <Text dim style={styles.loadTimeoutHint}>
                    {t("vault.loadTakingLong")}
                  </Text>
                  <View style={styles.loadTimeoutActions}>
                    <Button title={t("vault.tryAgain")} onPress={retryLoad} />
                  </View>
                </>
              ) : null}
            </View>
          ) : items.length === 0 && error ? (
            <View style={styles.loadingBlock}>
              <Text style={styles.emptyTitle}>{t("vault.loadFailedTitle")}</Text>
              <Text dim style={styles.emptyBody}>
                {t("vault.loadFailedBody")}
              </Text>
              <View style={styles.loadTimeoutActions}>
                <Button title={t("vault.tryAgain")} onPress={retryLoad} />
              </View>
            </View>
          ) : items.length === 0 ? (
            <VaultEmptyState
              onRegister={() => router.push("/add-belonging")}
              t={t}
            />
          ) : (
            <View style={styles.noMatchesWrap}>
              <Text dim style={styles.noMatchesText}>
                {t("vault.noSearchMatches")}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <VaultListRow item={item} t={t} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </Screen>
  );
}

function VaultStatCards({
  protectedCount,
  stolenCount,
  valueLabel,
  t,
}: {
  protectedCount: number;
  stolenCount: number;
  valueLabel: string;
  t: (k: import("@/src/i18n/types").TranslationKey) => string;
}) {
  return (
    <View style={styles.statRow}>
      <StatCard
        icon="shield-checkmark-outline"
        value={String(protectedCount)}
        label={t("vault.statProtected")}
      />
      <StatCard
        icon="warning-outline"
        value={String(stolenCount)}
        label={t("vault.statStolen")}
      />
      <StatCard
        icon="cash-outline"
        value={valueLabel}
        label={t("vault.statValue")}
      />
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={palette.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text muted mono style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function VaultSearch({
  value,
  onChangeText,
  t,
}: {
  value: string;
  onChangeText: (s: string) => void;
  t: (k: import("@/src/i18n/types").TranslationKey) => string;
}) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons
        name="search-outline"
        size={18}
        color="rgba(255,255,255,0.4)"
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t("vault.searchPlaceholderShort")}
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

function VaultEmptyState({
  onRegister,
  t,
}: {
  onRegister: () => void;
  t: (k: import("@/src/i18n/types").TranslationKey) => string;
}) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>{t("vault.emptyTitle")}</Text>
      <Text dim style={styles.emptyBody}>
        {t("vault.emptyBody")}
      </Text>
      <View style={styles.emptyCta}>
        <RegisterPrimaryCta
          label={t("vault.registerFirstAsset")}
          onPress={onRegister}
          icon="add"
          iconSize={24}
        />
      </View>
    </View>
  );
}

function VaultListRow({
  item,
  t,
}: {
  item: Belonging;
  t: (k: import("@/src/i18n/types").TranslationKey) => string;
}) {
  const router = useRouter();

  const thumbUri =
    item.photoUrl && item.photoUrl.trim()
      ? item.photoUrl.startsWith("data:image/")
        ? item.photoUrl
        : item.photoUrl.startsWith("http")
          ? item.photoUrl
          : `data:image/jpeg;base64,${item.photoUrl}`
      : "";

  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.92 }]}
      onPress={() => {
        // Instant details paint: seed cache before navigating.
        cacheBelonging(item);
        router.push((`/belonging/${item._id}` as unknown) as any);
      }}
    >
      <View style={styles.rowThumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.rowImage} />
        ) : (
          <Ionicons
            name="cube-outline"
            size={22}
            color="rgba(255,255,255,0.2)"
          />
        )}
      </View>
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text dim numberOfLines={1} style={styles.rowMeta}>
            {item.description}
          </Text>
        ) : (
          <Text muted numberOfLines={1} style={styles.rowMeta}>
            {item.chipUid}
          </Text>
        )}
      </View>
      <StatusPill stolen={item.isStolen} t={t} />
    </Pressable>
  );
}

function StatusPill({
  stolen,
  t,
}: {
  stolen: boolean;
  t: (k: import("@/src/i18n/types").TranslationKey) => string;
}) {
  return (
    <View style={[styles.pill, stolen ? styles.pillStolen : styles.pillOk]}>
      <Text style={[styles.pillText, stolen && styles.pillTextStolen]}>
        {stolen ? t("vault.statusStolen") : t("vault.statusOk")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  headerBlock: {
    marginTop: 6,
    marginBottom: 14,
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgba(255,255,255,0.96)",
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    textAlign: "center",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(255,255,255,0.96)",
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  pageSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 46,
    color: "rgba(255,255,255,0.94)",
    fontSize: 16,
  },
  addWrap: {
    marginBottom: 20,
  },
  error: {
    color: "tomato",
    marginBottom: 12,
    fontSize: 14,
  },
  loadingBlock: {
    paddingVertical: 48,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadTimeoutHint: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  loadTimeoutActions: {
    marginTop: 16,
    alignSelf: "center",
  },
  emptyWrap: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "rgba(255,255,255,0.92)",
  },
  emptyBody: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
  emptyCta: {
    marginTop: 22,
    width: "100%",
  },
  noMatchesWrap: {
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  noMatchesText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  rowThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowImage: {
    width: "100%",
    height: "100%",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
  },
  rowMeta: {
    fontSize: 13,
  },
  pill: {
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillOk: {
    borderColor: "rgba(57,217,138,0.28)",
    backgroundColor: "rgba(57,217,138,0.06)",
  },
  pillStolen: {
    borderColor: "rgba(255,100,100,0.35)",
    backgroundColor: "rgba(255,80,80,0.08)",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.55)",
  },
  pillTextStolen: {
    color: "rgba(255,160,160,0.95)",
  },
});
