import { Button } from "@/components/common_components/Button";
import { BackButton } from "@/components/common_components/BackButton";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { TransferRequest } from "@/src/api/transfers";
import {
  acceptTransfer,
  declineTransfer,
  listIncomingTransfers,
  listOutgoingTransfers,
  markOutgoingTransfersSeen,
} from "@/src/api/transfers";
import { useI18n } from "@/src/i18n/context";
import { setBelongingTransferStatus } from "@/src/state/belongingCache";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function bestDateForTransfer(t: TransferRequest): Date | null {
  return (
    parseIsoDate(t.respondedAt) ||
    parseIsoDate(t.updatedAt) ||
    parseIsoDate(t.createdAt)
  );
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
  // Fallback: short date.
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function cleanLabel(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (s === "-" || s === "—") return null;
  return s;
}

function readString(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;
  return cleanLabel(rec[key]);
}

function senderLabel(req: TransferRequest): string | null {
  const fromUser = req.fromUser;
  // Normal shape
  const viaFromUser = cleanLabel(fromUser?.name) || cleanLabel(fromUser?.email);
  if (viaFromUser) return viaFromUser;

  // Fallback shapes (backend variations / snapshots)
  const o = req as unknown;
  return (
    readString(o, "fromUserName") ||
    readString(o, "fromName") ||
    readString(o, "fromEmail") ||
    readString(o, "senderName") ||
    readString(o, "senderEmail") ||
    // Some APIs might include a `from` object
    readString(readFromObj(o, "from"), "name") ||
    readString(readFromObj(o, "from"), "email")
  );
}

function readFromObj(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return null;
  return (obj as Record<string, unknown>)[key];
}

function normalizePhotoUri(photoUrl?: string): string {
  const v = (photoUrl ?? "").trim();
  if (!v) return "";
  if (v.startsWith("data:image/")) return v;
  if (v.startsWith("http")) return v;
  return `data:image/jpeg;base64,${v}`;
}

export default function TransfersInboxScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [outgoing, setOutgoing] = useState<TransferRequest[]>([]);
  const [busyId, setBusyId] = useState<string>("");

  const pending = useMemo(
    () => requests.filter((r) => (r.status ?? "pending") === "pending"),
    [requests],
  );

  const incomingUpdates = useMemo(() => {
    return (requests ?? []).filter((r) => {
      const status = (r.status ?? "pending") as string;
      return status === "accepted" || status === "declined";
    });
  }, [requests]);

  const outgoingUpdates = useMemo(() => {
    return (outgoing ?? []).filter((r) => {
      const status = (r.status ?? "pending") as string;
      return status === "accepted" || status === "declined";
    });
  }, [outgoing]);

  const feed = useMemo(() => {
    type FeedItem =
      | {
          kind: "incoming";
          _id: string;
          createdAt: Date | null;
          req: TransferRequest;
        }
      | {
          kind: "incomingUpdate";
          _id: string;
          createdAt: Date | null;
          status: "accepted" | "declined";
          req: TransferRequest;
        }
      | {
          kind: "update";
          _id: string;
          createdAt: Date | null;
          status: "accepted" | "declined";
          req: TransferRequest;
        };

    const items: FeedItem[] = [];

    for (const r of pending) {
      items.push({
        kind: "incoming",
        _id: r._id,
        createdAt: bestDateForTransfer(r),
        req: r,
      });
    }

    for (const r of incomingUpdates) {
      const status = (r.status ?? "pending") as "accepted" | "declined" | string;
      if (status !== "accepted" && status !== "declined") continue;
      items.push({
        kind: "incomingUpdate",
        _id: r._id,
        createdAt: bestDateForTransfer(r),
        status,
        req: r,
      });
    }

    for (const r of outgoingUpdates) {
      const status = (r.status ?? "pending") as "accepted" | "declined" | string;
      if (status !== "accepted" && status !== "declined") continue;
      items.push({
        kind: "update",
        _id: r._id,
        createdAt: bestDateForTransfer(r),
        status,
        req: r,
      });
    }

    items.sort((a, b) => {
      const ta = a.createdAt?.getTime() ?? 0;
      const tb = b.createdAt?.getTime() ?? 0;
      return tb - ta;
    });

    return items;
  }, [incomingUpdates, outgoingUpdates, pending]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [inc, out] = await Promise.all([
        listIncomingTransfers(),
        listOutgoingTransfers(),
      ]);
      const incReqs = inc.data.requests ?? [];
      const outReqs = out.data.requests ?? [];
      setRequests(incReqs);
      setOutgoing(outReqs);

      // When an outgoing transfer has been responded to, it is no longer “transferring”.
      for (const r of outReqs) {
        const status = (r.status ?? "pending") as string;
        if (status === "accepted" || status === "declined") {
          setBelongingTransferStatus(r.belongingId, null);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
      // Mark sender-side updates as seen when opening notifications.
      void (async () => {
        try {
          const out = await listOutgoingTransfers();
          const list = out.data.requests ?? [];
          const ids = list
            .filter((r) => {
              const status = (r.status ?? "pending") as string;
              return (
                (status === "accepted" || status === "declined") &&
                !r.seenBySenderAt
              );
            })
            .map((r) => r._id);
          if (ids.length > 0) {
            await markOutgoingTransfersSeen(ids);
            // Optimistically update local state to remove unread dots immediately.
            setOutgoing((prev) =>
              prev.map((r) =>
                ids.includes(r._id) ? { ...r, seenBySenderAt: new Date().toISOString() } : r,
              ),
            );
          }
        } catch {
          // ignore
        }
      })();
    }, [load]),
  );

  const onAccept = useCallback(
    async (id: string) => {
      try {
        setBusyId(id);
        const res = await acceptTransfer(id);
        // Recipient accepted → the item is now owned by this user, so it must not
        // remain in a local “transferring” state.
        setBelongingTransferStatus(res.data.request.belongingId, null);
        await load();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("errors.failed"));
      } finally {
        setBusyId("");
      }
    },
    [load, t],
  );

  const onDecline = useCallback(
    async (id: string) => {
      try {
        setBusyId(id);
        await declineTransfer(id);
        await load();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("errors.failed"));
      } finally {
        setBusyId("");
      }
    },
    [load, t],
  );

  return (
    <Screen style={styles.screen} withTabBarInset={false}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} topInset={0} />
        <Text mono style={styles.headerTitle}>
          {t("transfers.title")}
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
      ) : pending.length === 0 &&
        outgoingUpdates.length === 0 &&
        incomingUpdates.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="notifications-outline"
            size={28}
            color="rgba(255,255,255,0.25)"
          />
          <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "800" }}>
            {t("transfers.emptyTitle")}
          </Text>
          <Text dim style={{ marginTop: 8, textAlign: "center", lineHeight: 22 }}>
            {t("transfers.emptyBody")}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 24 }}
        >
          {error ? (
            <Text style={{ color: "tomato", marginBottom: 8 }}>{error}</Text>
          ) : null}

          {feed.map((it) => {
            if (it.kind === "incomingUpdate") {
              const r = it.req;
              const status = it.status;
              const titleLine = r.title || t("transfers.requestTitleFallback");
              const thumbUri = normalizePhotoUri(r.photoUrl);
              const badge =
                status === "accepted"
                  ? t("transfers.badgeYouAccepted")
                  : t("transfers.badgeYouDeclined");
              const body =
                status === "accepted"
                  ? t("transfers.incomingAcceptedBody")
                  : t("transfers.incomingDeclinedBody");
              const canOpen = status === "accepted" && Boolean(r.belongingId);
              const Container = canOpen ? Pressable : View;
              const containerProps = canOpen
                ? {
                    onPress: () =>
                      router.push(
                        (`/belonging/${encodeURIComponent(r.belongingId)}` as unknown) as any,
                      ),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      styles.cardIncomingAccepted,
                      pressed && { opacity: 0.92 },
                    ],
                  }
                : { style: [styles.card, styles.cardIncomingAccepted] };

              return (
                <Container key={`iu:${r._id}:${status}`} {...(containerProps as any)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={status === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          status === "accepted"
                            ? "#39D98A"
                            : "rgba(255,120,120,0.95)"
                        }
                      />
                      <Text style={styles.cardTitle}>
                        {status === "accepted"
                          ? t("transfers.incomingAcceptedTitle")
                          : t("transfers.incomingDeclinedTitle")}
                      </Text>
                    </View>
                    <Text muted mono style={styles.cardTime}>
                      {formatTimestamp(it.createdAt, t)}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      {thumbUri ? (
                        <Image source={{ uri: thumbUri }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons
                          name="cube-outline"
                          size={18}
                          color="rgba(255,255,255,0.25)"
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text muted mono style={styles.badgeText}>
                        {badge}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {titleLine}
                      </Text>
                      <Text dim style={styles.cardBody}>
                        {body}
                      </Text>
                    </View>
                  </View>

                  {canOpen ? (
                    <Text style={styles.linkText}>{t("transfers.viewBelonging")}</Text>
                  ) : null}
                </Container>
              );
            }
            if (it.kind === "update") {
              const r = it.req;
              const status = it.status;
              const titleLine = r.title || t("transfers.requestTitleFallback");
              const thumbUri = normalizePhotoUri(r.photoUrl);
              const badge = t("transfers.badgeOutgoing");
              const label =
                status === "accepted"
                  ? t("transfers.updateAccepted").replace(
                      "{{name}}",
                      r.toUser?.name || r.toUser?.email || "—",
                    )
                  : t("transfers.updateDeclined").replace(
                      "{{name}}",
                      r.toUser?.name || r.toUser?.email || "—",
                    );
              const seen = Boolean(r.seenBySenderAt);
              return (
                <View
                  key={`u:${r._id}:${status}`}
                  style={[
                    styles.card,
                    status === "accepted"
                      ? styles.cardOutgoingAccepted
                      : styles.cardOutgoingDeclined,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={status === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          status === "accepted"
                            ? "#39D98A"
                            : "rgba(255,120,120,0.95)"
                        }
                      />
                      <Text style={styles.cardTitle}>
                        {status === "accepted"
                          ? t("transfers.acceptedToastTitle")
                          : t("transfers.declinedTitle")}
                      </Text>
                      {!seen ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text muted mono style={styles.cardTime}>
                      {formatTimestamp(it.createdAt, t)}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      {thumbUri ? (
                        <Image source={{ uri: thumbUri }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons
                          name="cube-outline"
                          size={18}
                          color="rgba(255,255,255,0.25)"
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text muted mono style={styles.badgeText}>
                        {badge}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {titleLine}
                      </Text>
                      <Text dim style={styles.cardBody}>
                        {label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }

            // incoming request
            const r = it.req;
            const titleLine = r.title || t("transfers.requestTitleFallback");
            const thumbUri = normalizePhotoUri(r.photoUrl);
            const badge = t("transfers.badgeIncoming");
            return (
              <View key={`i:${r._id}`} style={[styles.card, styles.cardIncomingPending]}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="swap-horizontal" size={18} color={palette.accent} />
                    <Text style={styles.cardTitle}>
                      {r.title || t("transfers.requestTitleFallback")}
                    </Text>
                  </View>
                  <Text muted mono style={styles.cardTime}>
                    {formatTimestamp(it.createdAt, t)}
                  </Text>
                </View>

                <View style={styles.previewRow}>
                  <View style={styles.thumb}>
                    {thumbUri ? (
                      <Image source={{ uri: thumbUri }} style={styles.thumbImg} />
                    ) : (
                      <Ionicons
                        name="cube-outline"
                        size={18}
                        color="rgba(255,255,255,0.25)"
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text muted mono style={styles.badgeText}>
                      {badge}
                    </Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {titleLine}
                    </Text>
                    <Text dim style={styles.cardBody}>
                      {t("transfers.requestBody").replace(
                        "{{from}}",
                        senderLabel(r) || t("transfers.someone"),
                      )}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 10, marginTop: 10 }}>
                  <Button
                    title={t("transfers.accept")}
                    onPress={() => void onAccept(r._id)}
                    disabled={busyId === r._id}
                  />
                  <Button
                    title={t("transfers.decline")}
                    variant="outline"
                    onPress={() => void onDecline(r._id)}
                    disabled={busyId === r._id}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    gap: 8,
  },
  cardIncomingPending: {
    borderColor: "rgba(120,255,185,0.20)",
    backgroundColor: "rgba(120,255,185,0.05)",
  },
  cardIncomingAccepted: {
    borderColor: "rgba(120,255,185,0.25)",
    backgroundColor: "rgba(120,255,185,0.03)",
  },
  cardOutgoingAccepted: {
    borderColor: "rgba(120,255,185,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardOutgoingDeclined: {
    borderColor: "rgba(255,120,120,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "rgba(255,255,255,0.94)",
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: "900",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 3,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: "900", flex: 1 },
  cardBody: { lineHeight: 20 },
  cardTime: { fontSize: 10, letterSpacing: 1.6, opacity: 0.65, marginLeft: 12 },
  linkText: {
    marginTop: 10,
    color: "rgba(255,255,255,0.80)",
    fontWeight: "900",
    letterSpacing: 1.4,
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.accent,
    opacity: 0.95,
  },
});

