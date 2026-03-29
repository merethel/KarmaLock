import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { formatVaultSyncLabel } from "@/components/vault/formatSyncLabel";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

import type { Belonging } from "@/src/api/belongings";
import { listMyBelongings } from "@/src/api/belongings";
import { palette } from "@/constants/Colors";
import { useI18n } from "@/src/i18n/context";

const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.10)";

export default function VaultDashboard() {
  const { t } = useI18n();
  const router = useRouter();

  const [items, setItems] = useState<Belonging[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await listMyBelongings();
      setItems(res.data.items || []);
      setLastSyncAt(new Date());
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "";
      setError(msg || t("errors.loadBelongingsFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const hay = `${i.title} ${i.description ?? ""} ${i.chipUid}`.toLowerCase();
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

  const syncLabel = formatVaultSyncLabel(lastSyncAt, t);
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
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.pageTitle}>{t("vault.simpleTitle")}</Text>
              <Text dim style={styles.pageSub}>
                {countLabel}
                {" · "}
                {t("vault.syncedPrefix")} {syncLabel}
              </Text>
            </View>

            <VaultStatCards
              protectedCount={protectedCount}
              stolenCount={stolenCount}
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

            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={palette.accent} />
              <Text dim style={{ marginTop: 12 }}>
                {t("vault.loading")}
              </Text>
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
  t,
}: {
  protectedCount: number;
  stolenCount: number;
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
        value="—"
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
        <RegisterFirstAssetCta
          label={t("vault.registerFirstAsset")}
          onPress={onRegister}
        />
      </View>
    </View>
  );
}

function RegisterFirstAssetCta({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.registerCta,
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.registerCtaIconCircle}>
        <Ionicons name="add" size={24} color={palette.accent} />
      </View>
      <Text style={styles.registerCtaLabel}>{label}</Text>
    </Pressable>
  );
}

function VaultListRow({
  item,
  t,
}: {
  item: Belonging;
  t: (k: import("@/src/i18n/types").TranslationKey) => string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.listRow,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.rowThumb}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.rowImage} />
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
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
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
    maxWidth: 320,
    alignSelf: "center",
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
  registerCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 54,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  registerCtaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  registerCtaLabel: {
    flexShrink: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
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
