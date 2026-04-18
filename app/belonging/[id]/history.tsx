import { BackButton } from "@/components/common_components/BackButton";
import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import {
  type BelongingEventMetadata,
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
  StyleSheet,
  View
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
  if (min < 60)
    return t("vault.syncedMinutesAgo").replace("{{count}}", String(min));
  const h = Math.round(min / 60);
  if (h < 24) return t("vault.syncedHoursAgo").replace("{{count}}", String(h));
  const days = Math.round(h / 24);
  if (days < 14)
    return t("vault.syncedDaysAgo").replace("{{count}}", String(days));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCreatedDay(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toComparable(value: unknown): unknown {
  // Treat empty-ish values as the same to avoid noisy "— → —" changes.
  if (value == null) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? "" : trimmed;
  }
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    if ("toHexString" in (value as { toHexString?: unknown })) {
      try {
        return String(value);
      } catch {
        // ignore
      }
    }
  }
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  const aa = toComparable(a);
  const bb = toComparable(b);
  if (aa === bb) return true;
  try {
    return JSON.stringify(aa) === JSON.stringify(bb);
  } catch {
    return false;
  }
}

function safeChanges(
  meta: unknown,
): Array<{ field: string; from?: unknown; to?: unknown }> {
  if (!meta || typeof meta !== "object") return [];
  const m = meta as Record<string, unknown>;
  const raw = m.changes;
  if (!raw || typeof raw !== "object") return [];
  const changes = raw as Record<string, unknown>;
  const out: Array<{ field: string; from?: unknown; to?: unknown }> = [];
  for (const [field, v] of Object.entries(changes)) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    if (valuesEqual(o.from, o.to)) continue;
    out.push({ field, from: o.from, to: o.to });
  }
  return out;
}

function normalizeMetadata(meta: unknown): unknown {
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta) as unknown;
    } catch {
      return meta;
    }
  }
  if (meta && typeof meta === "object") return meta;
  return null;
}

function parseBelongingEventMetadata(
  meta: unknown,
): BelongingEventMetadata | null {
  const m = normalizeMetadata(meta);
  if (!m || typeof m !== "object") return null;
  return m as BelongingEventMetadata;
}

/** `metadata.fromUser` / `metadata.toUser` — `BelongingEventUserSnapshot`. */
function labelFromUserSnapshot(u: unknown): string | undefined {
  if (!u || typeof u !== "object") return undefined;
  const o = u as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const id = typeof o.id === "string" ? o.id.trim() : "";
  return name || email || id || undefined;
}

function partyLine(meta: BelongingEventMetadata | null): {
  from?: string;
  to?: string;
} | null {
  if (!meta) return null;
  const from = labelFromUserSnapshot(meta.fromUser);
  const to = labelFromUserSnapshot(meta.toUser);
  if (!from && !to) return null;
  return { from, to };
}

function metadataNote(meta: BelongingEventMetadata | null): string | null {
  if (!meta?.note) return null;
  const s = meta.note.trim();
  return s || null;
}

function grantIdFromMetadata(meta: BelongingEventMetadata | null): string | null {
  if (!meta?.grantId) return null;
  const s = meta.grantId.trim();
  return s || null;
}

const GRANT_EVENT_TYPES = new Set<string>([
  "belonging.grant.created",
  "belonging.grant.accepted",
  "belonging.grant.declined",
  "belonging.grant.revoked",
  "belonging.grant.invite_cancelled",
]);

const TRANSFER_EVENT_TYPES = new Set<string>([
  "belonging.transfer.requested",
  "belonging.transfer.accepted",
  "belonging.transfer.declined",
  "belonging.transfer.cancelled",
]);

const GRANT_DEDUPE_TYPES = new Set<string>([
  "belonging.grant.created",
  "belonging.grant.accepted",
]);

function isGrantEventType(type: string): boolean {
  return GRANT_EVENT_TYPES.has(type);
}

function isTransferEventType(type: string): boolean {
  return TRANSFER_EVENT_TYPES.has(type);
}

function historyEventTitle(
  type: string,
  t: (k: import("@/src/i18n/types").TranslationKey) => string,
): string {
  switch (type) {
    case "belonging.created":
      return t("vault.historyCreated");
    case "belonging.updated":
      return t("vault.historyUpdated");
    case "belonging.grant.created":
      return t("vault.historyEventGrantCreated");
    case "belonging.grant.accepted":
      return t("vault.historyEventGrantAccepted");
    case "belonging.grant.declined":
      return t("vault.historyEventGrantDeclined");
    case "belonging.grant.revoked":
      return t("vault.historyGrantRevoked");
    case "belonging.grant.invite_cancelled":
      return t("vault.historyEventGrantInviteCancelled");
    case "belonging.transfer.requested":
      return t("vault.historyTransferRequested");
    case "belonging.transfer.accepted":
      return t("vault.historyTransferAccepted");
    case "belonging.transfer.declined":
      return t("vault.historyTransferDeclined");
    case "belonging.transfer.cancelled":
      return t("vault.historyTransferCancelled");
    default:
      return t("vault.historyEvent");
  }
}

/** One report row per `metadata.grantId` for invite + accepted (newest kept first). */
function dedupeGrantHistoryEvents(events: BelongingHistoryEvent[]): BelongingHistoryEvent[] {
  const seen = new Set<string>();
  const out: BelongingHistoryEvent[] = [];
  for (const e of events) {
    if (GRANT_DEDUPE_TYPES.has(e.type)) {
      const gid = grantIdFromMetadata(parseBelongingEventMetadata(e.metadata));
      if (gid) {
        if (seen.has(gid)) continue;
        seen.add(gid);
      }
    }
    out.push(e);
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
      setEvents(dedupeGrantHistoryEvents(sorted));
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
      const res = await getBelongingHistory({
        belongingId: idStr,
        cursor,
        limit: 50,
      });
      const list = res.data.events ?? [];
      const merged = [...events, ...list];
      merged.sort((a, b) => {
        const ta = parseIsoDate(a.createdAt)?.getTime() ?? 0;
        const tb = parseIsoDate(b.createdAt)?.getTime() ?? 0;
        return tb - ta;
      });
      setEvents(dedupeGrantHistoryEvents(merged));
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

  const empty = useMemo(
    () => !loading && events.length === 0 && !error,
    [error, events.length, loading],
  );

  return (
    <Screen style={styles.screen} withTabBarInset={false} dismissKeyboardOnPress={false}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} topInset={0} />
        <Text mono style={styles.headerTitle}>
          {t("vault.editHistoryTitle")}
        </Text>
        <View style={{ width: 42 }} />
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
          <Ionicons
            name="time-outline"
            size={28}
            color="rgba(255,255,255,0.25)"
          />
          <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "800" }}>
            {t("vault.editHistoryEmptyTitle")}
          </Text>
          <Text
            dim
            style={{ marginTop: 8, textAlign: "center", lineHeight: 22 }}
          >
            {t("vault.editHistoryEmptyBody")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e._id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const when = formatTimestamp(parseIsoDate(item.createdAt), t);
            const meta = parseBelongingEventMetadata(item.metadata);
            const changes = safeChanges(meta);
            const isGrant = isGrantEventType(item.type);
            const isTransfer = isTransferEventType(item.type);
            const transferParties = isTransfer ? partyLine(meta) : null;
            const grantParties = isGrant ? partyLine(meta) : null;
            const note = metadataNote(meta);
            const title = historyEventTitle(item.type, t);

            const isCreated = item.type === "belonging.created";
            const createdByName =
              (item.actor?.name || item.actor?.email || "").trim() || "";
            const createdOnDate =
              isCreated && meta?.belongingCreatedAt
                ? parseIsoDate(meta.belongingCreatedAt) ?? parseIsoDate(item.createdAt)
                : parseIsoDate(item.createdAt);
            const createdDay = formatCreatedDay(createdOnDate);

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text muted mono style={styles.cardTime}>
                    {when}
                  </Text>
                </View>

                {isCreated ? (
                  <View style={{ marginTop: 8, gap: 6 }}>
                    <Text dim style={styles.cardMeta}>
                      {t("vault.historyCreatedOn").replace("{{date}}", createdDay)}
                    </Text>
                    {createdByName ? (
                      <Text dim style={styles.cardMeta}>
                        {t("vault.historyCreatedBy").replace("{{name}}", createdByName)}
                      </Text>
                    ) : (
                      <Text dim style={styles.cardMeta}>
                        {t("vault.historyCreatedByUnknown")}
                      </Text>
                    )}
                  </View>
                ) : null}

                {transferParties ? (
                  <Text
                    dim
                    style={[
                      styles.cardMeta,
                      !isCreated ? { marginTop: 6 } : null,
                    ]}
                  >
                    {t("vault.historyOwnership")
                      .replace("{{from}}", transferParties.from ?? "—")
                      .replace("{{to}}", transferParties.to ?? "—")}
                  </Text>
                ) : null}

                {grantParties ? (
                  <Text
                    dim
                    style={[
                      styles.cardMeta,
                      !isCreated ? { marginTop: 6 } : null,
                    ]}
                  >
                    {t("vault.historyGrantLine")
                      .replace("{{from}}", grantParties.from ?? "—")
                      .replace("{{to}}", grantParties.to ?? "—")}
                  </Text>
                ) : null}

                {isTransfer ? (
                  <Text
                    dim
                    style={[styles.cardMeta, !isCreated ? { marginTop: 6 } : null]}
                  >
                    {note
                      ? t("vault.historyNote").replace("{{note}}", note)
                      : t("vault.historyNoTransferNote")}
                  </Text>
                ) : note ? (
                  <Text
                    dim
                    style={[styles.cardMeta, !isCreated ? { marginTop: 6 } : null]}
                  >
                    {t("vault.historyNote").replace("{{note}}", note)}
                  </Text>
                ) : null}

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
                ) : null}
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
  headerTitle: {
    fontSize: 12,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  error: { color: "tomato", textAlign: "center" },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", flex: 1 },
  cardTime: { fontSize: 10, letterSpacing: 1.6, opacity: 0.65 },
  cardMeta: { marginTop: 6, lineHeight: 18 },
  changeRow: { gap: 4 },
  changeField: { fontSize: 10, letterSpacing: 1.6, opacity: 0.65 },
  changeValue: { lineHeight: 20 },
});
