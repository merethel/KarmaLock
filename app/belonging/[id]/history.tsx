import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import {
  type BelongingHistoryEvent,
  getBelongingHistory,
} from "@/src/api/belongingHistory";
import { useI18n } from "@/src/i18n/context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTimestamp(
  d: Date | null,
  t: (k: import("@/src/i18n/types").TranslationKey) => string,
): string {
  if (!d) return "";
  const now = Date.now();
  const diffMs = now - d.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return t("vault.syncedJustNow");
  if (min < 60) return t("vault.syncedMinutesAgo").replace("{{count}}", String(min));
  const h = Math.round(min / 60);
  if (h < 24) return t("vault.syncedHoursAgo").replace("{{count}}", String(h));
  const days = Math.round(h / 24);
  if (days < 14) return t("vault.syncedDaysAgo").replace("{{count}}", String(days));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function safeChanges(meta: unknown): Array<{ field: string; from?: unknown; to?: unknown }> {
  if (!meta || typeof meta !== "object") return [];
  const m = meta as Record<string, unknown>;
  const raw = m.changes;
  if (!raw || typeof raw !== "object") return [];
  const changes = raw as Record<string, unknown>;
  const out: Array<{ field: string; from?: unknown; to?: unknown }> = [];
  for (const [field, v] of Object.entries(changes)) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    out.push({ field, from: o.from, to: o.to });
  }
  return out;
}

function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v || "—";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "…";
}

export default function BelongingHistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idStr = typeof id === "string" ? id : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<BelongingHistoryEvent[]>([]);
  const [cursor, setCursor] = useState<string>("");
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);

  const load = useCallback(async () => {
    if (!idStr) return;
    try {
      setLoading(true);
      setError("");
      const res = await getBelongingHistory({ belongingId: idStr, limit: 50 });
      const list = res.data.events ?? [];
      // Backend should return newest first; sort defensively anyway.
      const sorted = [...list].sort((a, b) => {
        const ta = parseIsoDate(a.createdAt)?.getTime() ?? 0;
        const tb = parseIsoDate(b.createdAt)?.getTime() ?? 0;
        return tb - ta;
      });
      setEvents(sorted);
      const next = res.data.nextCursor ?? "";
      setCursor(next || "");
      setHasMore(Boolean(next));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setLoading(false);
    }
  }, [idStr, t]);

  const loadMore = useCallback(async () => {
    if (!idStr || !cursor || moreBusy) return;
    try {
      setMoreBusy(true);
      const res = await getBelongingHistory({ belongingId: idStr, cursor, limit: 50 });
      const list = res.data.events ?? [];
      const merged = [...events, ...list];
      merged.sort((a, b) => {
        const ta = parseIsoDate(a.createdAt)?.getTime() ?? 0;
        const tb = parseIsoDate(b.createdAt)?.getTime() ?? 0;
        return tb - ta;
      });
      setEvents(merged);
      const next = res.data.nextCursor ?? "";
      setCursor(next || "");
      setHasMore(Boolean(next));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setMoreBusy(false);
    }
  }, [cursor, events, idStr, moreBusy, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const empty = useMemo(() => !loading && events.length === 0 && !error, [error, events.length, loading]);

  return (
    <Screen style={styles.screen} withTabBarInset={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{t("registerFlow.back")}</Text>
        </Pressable>
        <Text mono style={styles.headerTitle}>
          {t("vault.editHistoryTitle")}
        </Text>
        <View style={{ width: 36 }} />
      </View>

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
            <Button title={t("vault.tryAgain")} onPress={() => void load()} />
          </View>
        </View>
      ) : empty ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={28} color="rgba(255,255,255,0.25)" />
          <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "800" }}>
            {t("vault.editHistoryEmptyTitle")}
          </Text>
          <Text dim style={{ marginTop: 8, textAlign: "center", lineHeight: 22 }}>
            {t("vault.editHistoryEmptyBody")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e._id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const when = formatTimestamp(parseIsoDate(item.createdAt), t);
            const actor = item.actor?.name || item.actor?.email || "—";
            const changes = safeChanges(item.metadata);

            const title =
              item.type === "belonging.created"
                ? t("vault.historyCreated")
                : item.type === "belonging.updated"
                  ? t("vault.historyUpdated")
                  : item.type.includes("transfer")
                    ? t("vault.historyTransfer")
                    : t("vault.historyEvent");

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text muted mono style={styles.cardTime}>
                    {when}
                  </Text>
                </View>
                <Text dim style={styles.cardMeta}>
                  {t("vault.historyBy").replace("{{name}}", actor)}
                </Text>

                {changes.length > 0 ? (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {changes.slice(0, 6).map((c) => (
                      <View key={c.field} style={styles.changeRow}>
                        <Text muted mono style={styles.changeField}>
                          {c.field.toUpperCase()}
                        </Text>
                        <Text dim style={styles.changeValue} numberOfLines={2}>
                          {formatValue(c.from)} → {formatValue(c.to)}
                        </Text>
                      </View>
                    ))}
                    {changes.length > 6 ? (
                      <Text muted style={{ marginTop: 2 }}>
                        {t("vault.historyMoreChanges").replace(
                          "{{count}}",
                          String(changes.length - 6),
                        )}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text dim style={{ marginTop: 10 }}>
                    {t("vault.historyNoDetails")}
                  </Text>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            hasMore ? (
              <View style={{ marginTop: 8, paddingHorizontal: 6 }}>
                <Button
                  title={moreBusy ? t("vault.loading") : t("vault.loadMore")}
                  onPress={() => void loadMore()}
                  disabled={moreBusy}
                  variant="outline"
                />
              </View>
            ) : (
              <View style={{ height: 10 }} />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
  },
  backBtn: { paddingVertical: 6, width: 72 },
  backText: { color: "rgba(255,255,255,0.85)", fontSize: 15 },
  headerTitle: {
    fontSize: 12,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  error: { color: "tomato", textAlign: "center" },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "900", flex: 1 },
  cardTime: { fontSize: 10, letterSpacing: 1.6, opacity: 0.65 },
  cardMeta: { marginTop: 6, lineHeight: 18 },
  changeRow: { gap: 4 },
  changeField: { fontSize: 10, letterSpacing: 1.6, opacity: 0.65 },
  changeValue: { lineHeight: 20 },
});

