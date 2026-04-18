import { Button } from "@/components/common_components/Button";
import { BackButton } from "@/components/common_components/BackButton";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { TransferRequest } from "@/src/api/transfers";
import type { Grant } from "@/src/api/grants";
import {
  acceptTransfer,
  declineTransfer,
  listIncomingTransfers,
  listOutgoingTransfers,
  markOutgoingTransfersSeen,
} from "@/src/api/transfers";
import {
  acceptGrant,
  declineGrant,
  listIncomingGrants,
  listOutgoingGrants,
} from "@/src/api/grants";
import {
  appendInboxActivity,
  loadInboxActivity,
  type InboxActivityEntry,
} from "@/src/notifications/inboxActivityLog";
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

function bestDateForGrant(g: Grant): Date | null {
  return parseIsoDate(g.respondedAt) || parseIsoDate(g.createdAt);
}

function grantInboxOutcome(g: Grant): "accepted" | "declined" {
  const s = (g.status ?? "").toLowerCase();
  if (s === "declined") return "declined";
  return "accepted";
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
  const [grantRequests, setGrantRequests] = useState<Grant[]>([]);
  const [outgoingGrants, setOutgoingGrants] = useState<Grant[]>([]);
  const [activityLog, setActivityLog] = useState<InboxActivityEntry[]>([]);
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

  const respondedGrantsFromApi = useMemo(
    () =>
      (grantRequests ?? []).filter((g) => {
        const s = (g.status ?? "").toLowerCase();
        if (s === "revoked") return false;
        return s === "accepted" || s === "declined" || s === "active";
      }),
    [grantRequests],
  );

  const respondedOutgoingGrantsFromApi = useMemo(
    () =>
      (outgoingGrants ?? []).filter((g) => {
        const s = (g.status ?? "").toLowerCase();
        if (s === "revoked") return false;
        return s === "accepted" || s === "declined" || s === "active";
      }),
    [outgoingGrants],
  );

  const mergedRows = useMemo(() => {
    type FeedItem = (typeof feed)[number];
    type Merged =
      | { kind: "feed"; item: FeedItem; at: number }
      | { kind: "grantApi"; g: Grant; at: number }
      | { kind: "grantLocal"; e: Extract<InboxActivityEntry, { kind: "grant_response" }>; at: number }
      | { kind: "grantOutgoingApi"; g: Grant; at: number }
      | {
          kind: "grantOutgoingLocal";
          e: Extract<InboxActivityEntry, { kind: "grant_owner_outcome" }>;
          at: number;
        }
      | {
          kind: "transferLocal";
          e: Extract<InboxActivityEntry, { kind: "transfer_response" }>;
          at: number;
        };

    const rows: Merged[] = [];
    for (const it of feed) {
      rows.push({ kind: "feed", item: it, at: it.createdAt?.getTime() ?? 0 });
    }
    for (const g of respondedGrantsFromApi) {
      rows.push({
        kind: "grantApi",
        g,
        at: bestDateForGrant(g)?.getTime() ?? 0,
      });
    }
    for (const g of respondedOutgoingGrantsFromApi) {
      rows.push({
        kind: "grantOutgoingApi",
        g,
        at: bestDateForGrant(g)?.getTime() ?? 0,
      });
    }
    for (const e of activityLog) {
      if (e.kind === "grant_response") {
        if (grantRequests.some((gg) => gg._id === e.grantId)) continue;
        rows.push({
          kind: "grantLocal",
          e,
          at: parseIsoDate(e.createdAt)?.getTime() ?? 0,
        });
      } else if (e.kind === "transfer_response") {
        if (requests.some((r) => r._id === e.transferId)) continue;
        rows.push({
          kind: "transferLocal",
          e,
          at: parseIsoDate(e.createdAt)?.getTime() ?? 0,
        });
      } else if (e.kind === "grant_owner_outcome") {
        if (outgoingGrants.some((gg) => gg._id === e.grantId)) continue;
        rows.push({
          kind: "grantOutgoingLocal",
          e,
          at: parseIsoDate(e.createdAt)?.getTime() ?? 0,
        });
      }
    }
    rows.sort((a, b) => b.at - a.at);
    return rows;
  }, [
    activityLog,
    feed,
    grantRequests,
    outgoingGrants,
    requests,
    respondedGrantsFromApi,
    respondedOutgoingGrantsFromApi,
  ]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [inc, out, grantsIn, grantsOut, activity] = await Promise.all([
        listIncomingTransfers(),
        listOutgoingTransfers(),
        listIncomingGrants(),
        listOutgoingGrants().catch(() => ({ data: { grants: [] as Grant[] } })),
        loadInboxActivity(),
      ]);
      const incReqs = inc.data.requests ?? [];
      const outReqs = out.data.requests ?? [];
      const incomingGrantList = grantsIn.data.grants ?? [];
      const outgoingGrantList = grantsOut.data.grants ?? [];
      setRequests(incReqs);
      setOutgoing(outReqs);
      setGrantRequests(incomingGrantList);
      setOutgoingGrants(outgoingGrantList);

      const ownerLogged = new Set(
        activity
          .filter((e): e is Extract<InboxActivityEntry, { kind: "grant_owner_outcome" }> => {
            return e.kind === "grant_owner_outcome";
          })
          .map((e) => e.grantId),
      );

      for (const g of outgoingGrantList) {
        const s = (g.status ?? "").toLowerCase();
        if (s !== "active" && s !== "declined") continue;
        if (ownerLogged.has(g._id)) continue;
        const outcome = s === "declined" ? "declined" : "accepted";
        await appendInboxActivity({
          v: 1,
          id: `grant-owner-${g._id}-${outcome}`,
          createdAt:
            parseIsoDate(g.respondedAt)?.toISOString() ?? new Date().toISOString(),
          kind: "grant_owner_outcome",
          grantId: g._id,
          belongingId: g.belongingId,
          outcome,
          toName: g.toUser?.name,
          toEmail: g.toUser?.email,
        });
        ownerLogged.add(g._id);
      }

      setActivityLog(await loadInboxActivity());

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
    async (r: TransferRequest) => {
      try {
        setBusyId(r._id);
        const res = await acceptTransfer(r._id);
        // Recipient accepted → the item is now owned by this user, so it must not
        // remain in a local “transferring” state.
        setBelongingTransferStatus(res.data.request.belongingId, null);
        await appendInboxActivity({
          v: 1,
          id: `transfer-${r._id}-accepted`,
          createdAt: new Date().toISOString(),
          kind: "transfer_response",
          transferId: r._id,
          belongingId: r.belongingId,
          outcome: "accepted",
          title: r.title,
        });
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
    async (r: TransferRequest) => {
      try {
        setBusyId(r._id);
        await declineTransfer(r._id);
        await appendInboxActivity({
          v: 1,
          id: `transfer-${r._id}-declined`,
          createdAt: new Date().toISOString(),
          kind: "transfer_response",
          transferId: r._id,
          belongingId: r.belongingId,
          outcome: "declined",
          title: r.title,
        });
        await load();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("errors.failed"));
      } finally {
        setBusyId("");
      }
    },
    [load, t],
  );

  const onAcceptGrant = useCallback(
    async (g: Grant) => {
      try {
        setBusyId(g._id);
        await acceptGrant(g._id);
        await appendInboxActivity({
          v: 1,
          id: `grant-${g._id}-accepted`,
          createdAt: new Date().toISOString(),
          kind: "grant_response",
          grantId: g._id,
          belongingId: g.belongingId,
          outcome: "accepted",
          fromName: g.fromUser?.name,
          fromEmail: g.fromUser?.email,
        });
        await load();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("errors.failed"));
      } finally {
        setBusyId("");
      }
    },
    [load, t],
  );

  const onDeclineGrant = useCallback(
    async (g: Grant) => {
      try {
        setBusyId(g._id);
        await declineGrant(g._id);
        await appendInboxActivity({
          v: 1,
          id: `grant-${g._id}-declined`,
          createdAt: new Date().toISOString(),
          kind: "grant_response",
          grantId: g._id,
          belongingId: g.belongingId,
          outcome: "declined",
          fromName: g.fromUser?.name,
          fromEmail: g.fromUser?.email,
        });
        await load();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("errors.failed"));
      } finally {
        setBusyId("");
      }
    },
    [load, t],
  );

  const pendingGrants = useMemo(
    () => (grantRequests ?? []).filter((g) => (g.status ?? "pending") === "pending"),
    [grantRequests],
  );

  return (
    <Screen
      style={styles.screen}
      withTabBarInset={false}
      dismissKeyboardOnPress={false}
      keyboardAvoiding={false}
    >
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
      ) : pendingGrants.length === 0 && mergedRows.length === 0 ? (
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {error ? (
            <Text style={{ color: "tomato", marginBottom: 8 }}>{error}</Text>
          ) : null}

          {pendingGrants.length > 0 ? (
            <View style={{ gap: 12 }}>
              <Text mono style={{ fontSize: 12, letterSpacing: 3, opacity: 0.9 }}>
                {t("grants.inboxTitle")}
              </Text>
              {pendingGrants.slice(0, 10).map((g) => {
                const from = g.fromUser?.name || g.fromUser?.email || t("transfers.someone");
                const body = t("grants.requestBody").replace("{{from}}", from);
                return (
                  <View key={`g:${g._id}`} style={[styles.card, styles.cardIncomingPending]}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTitleRow}>
                        <Ionicons name="person-add" size={18} color={palette.accent} />
                        <Text style={styles.cardTitle}>{t("grants.title")}</Text>
                      </View>
                    </View>
                    <Text dim style={styles.cardBody}>
                      {body}
                    </Text>
                    <View style={{ gap: 10, marginTop: 10 }}>
                      <Button
                        title={t("grants.accept")}
                        onPress={() => void onAcceptGrant(g)}
                        disabled={busyId === g._id}
                      />
                      <Button
                        title={t("grants.decline")}
                        variant="outline"
                        onPress={() => void onDeclineGrant(g)}
                        disabled={busyId === g._id}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {mergedRows.map((row) => {
            if (row.kind === "grantApi") {
              const g = row.g;
              const outcome = grantInboxOutcome(g);
              const from = g.fromUser?.name || g.fromUser?.email || t("transfers.someone");
              const createdAt = bestDateForGrant(g);
              const canOpen = outcome === "accepted" && Boolean(g.belongingId);
              const Container = canOpen ? Pressable : View;
              const containerProps = canOpen
                ? {
                    onPress: () =>
                      router.push(
                        (`/belonging/${encodeURIComponent(g.belongingId)}` as unknown) as any,
                      ),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      styles.cardIncomingAccepted,
                      pressed && { opacity: 0.92 },
                    ],
                  }
                : { style: [styles.card, styles.cardIncomingAccepted] };
              const acceptGreen = "#39D98A";
              return (
                <Container key={`ga:${g._id}`} {...(containerProps as any)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={outcome === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          outcome === "accepted"
                            ? acceptGreen
                            : "rgba(255,120,120,0.95)"
                        }
                      />
                      <Text style={styles.cardTitle}>
                        {outcome === "accepted"
                          ? t("grants.acceptedTitle")
                          : t("grants.inboxGrantDeclinedTitle")}
                      </Text>
                    </View>
                    <Text muted mono style={styles.cardTime}>
                      {formatTimestamp(createdAt, t)}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      <Ionicons
                        name="person-add"
                        size={18}
                        color="rgba(255,255,255,0.25)"
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text muted mono style={styles.badgeText}>
                        {outcome === "accepted"
                          ? t("transfers.badgeYouAccepted")
                          : t("transfers.badgeYouDeclined")}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {t("grants.title")}
                      </Text>
                      <Text dim style={styles.cardBody}>
                        {outcome === "accepted"
                          ? t("grants.acceptedBody")
                          : t("grants.inboxGrantDeclinedBody").replace("{{from}}", from)}
                      </Text>
                    </View>
                  </View>
                  {canOpen ? (
                    <Text style={styles.linkText}>{t("transfers.viewBelonging")}</Text>
                  ) : null}
                </Container>
              );
            }
            if (row.kind === "grantLocal") {
              const e = row.e;
              const outcome = e.outcome;
              const from =
                e.fromName || e.fromEmail || t("transfers.someone");
              const createdAt = parseIsoDate(e.createdAt);
              const canOpen = outcome === "accepted" && Boolean(e.belongingId);
              const Container = canOpen ? Pressable : View;
              const containerProps = canOpen
                ? {
                    onPress: () =>
                      router.push(
                        (`/belonging/${encodeURIComponent(e.belongingId!)}` as unknown) as any,
                      ),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      styles.cardIncomingAccepted,
                      pressed && { opacity: 0.92 },
                    ],
                  }
                : { style: [styles.card, styles.cardIncomingAccepted] };
              const acceptGreen = "#39D98A";
              return (
                <Container key={`gl:${e.id}`} {...(containerProps as any)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={outcome === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          outcome === "accepted"
                            ? acceptGreen
                            : "rgba(255,120,120,0.95)"
                        }
                      />
                      <Text style={styles.cardTitle}>
                        {outcome === "accepted"
                          ? t("grants.acceptedTitle")
                          : t("grants.inboxGrantDeclinedTitle")}
                      </Text>
                    </View>
                    <Text muted mono style={styles.cardTime}>
                      {formatTimestamp(createdAt, t)}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      <Ionicons
                        name="person-add"
                        size={18}
                        color="rgba(255,255,255,0.25)"
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text muted mono style={styles.badgeText}>
                        {outcome === "accepted"
                          ? t("transfers.badgeYouAccepted")
                          : t("transfers.badgeYouDeclined")}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {t("grants.title")}
                      </Text>
                      <Text dim style={styles.cardBody}>
                        {outcome === "accepted"
                          ? t("grants.acceptedBody")
                          : t("grants.inboxGrantDeclinedBody").replace("{{from}}", from)}
                      </Text>
                    </View>
                  </View>
                  {canOpen ? (
                    <Text style={styles.linkText}>{t("transfers.viewBelonging")}</Text>
                  ) : null}
                </Container>
              );
            }
            if (row.kind === "grantOutgoingApi") {
              const g = row.g;
              const outcome = grantInboxOutcome(g);
              const name =
                g.toUser?.name || g.toUser?.email || t("transfers.someone");
              const createdAt = bestDateForGrant(g);
              const canOpen = outcome === "accepted" && Boolean(g.belongingId);
              const Container = canOpen ? Pressable : View;
              const containerProps = canOpen
                ? {
                    onPress: () =>
                      router.push(
                        (`/belonging/${encodeURIComponent(g.belongingId)}` as unknown) as any,
                      ),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      outcome === "accepted"
                        ? styles.cardOutgoingAccepted
                        : styles.cardOutgoingDeclined,
                      pressed && { opacity: 0.92 },
                    ],
                  }
                : {
                    style: [
                      styles.card,
                      outcome === "accepted"
                        ? styles.cardOutgoingAccepted
                        : styles.cardOutgoingDeclined,
                    ],
                  };
              const acceptGreen = "#7CFFB9";
              const label =
                outcome === "accepted"
                  ? t("grants.ownerInviteAcceptedBody").replace("{{name}}", name)
                  : t("grants.ownerInviteDeclinedBody").replace("{{name}}", name);
              return (
                <Container key={`goa:${g._id}`} {...(containerProps as any)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={outcome === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          outcome === "accepted"
                            ? acceptGreen
                            : "rgba(255,120,120,0.95)"
                        }
                      />
                      <Text style={styles.cardTitle}>
                        {outcome === "accepted"
                          ? t("grants.ownerInviteAcceptedTitle")
                          : t("grants.ownerInviteDeclinedTitle")}
                      </Text>
                    </View>
                    <Text muted mono style={styles.cardTime}>
                      {formatTimestamp(createdAt, t)}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      <Ionicons
                        name="person-add"
                        size={18}
                        color="rgba(255,255,255,0.25)"
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text muted mono style={styles.badgeText}>
                        {t("transfers.badgeOutgoing")}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {t("grants.title")}
                      </Text>
                      <Text dim style={styles.cardBody}>
                        {label}
                      </Text>
                    </View>
                  </View>
                  {canOpen ? (
                    <Text style={styles.linkText}>{t("transfers.viewBelonging")}</Text>
                  ) : null}
                </Container>
              );
            }
            if (row.kind === "grantOutgoingLocal") {
              const e = row.e;
              const outcome = e.outcome;
              const name =
                e.toName || e.toEmail || t("transfers.someone");
              const createdAt = parseIsoDate(e.createdAt);
              const canOpen = outcome === "accepted" && Boolean(e.belongingId);
              const Container = canOpen ? Pressable : View;
              const containerProps = canOpen
                ? {
                    onPress: () =>
                      router.push(
                        (`/belonging/${encodeURIComponent(e.belongingId!)}` as unknown) as any,
                      ),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      outcome === "accepted"
                        ? styles.cardOutgoingAccepted
                        : styles.cardOutgoingDeclined,
                      pressed && { opacity: 0.92 },
                    ],
                  }
                : {
                    style: [
                      styles.card,
                      outcome === "accepted"
                        ? styles.cardOutgoingAccepted
                        : styles.cardOutgoingDeclined,
                    ],
                  };
              const acceptGreen = "#7CFFB9";
              const label =
                outcome === "accepted"
                  ? t("grants.ownerInviteAcceptedBody").replace("{{name}}", name)
                  : t("grants.ownerInviteDeclinedBody").replace("{{name}}", name);
              return (
                <Container key={`gol:${e.id}`} {...(containerProps as any)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={outcome === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          outcome === "accepted"
                            ? acceptGreen
                            : "rgba(255,120,120,0.95)"
                        }
                      />
                      <Text style={styles.cardTitle}>
                        {outcome === "accepted"
                          ? t("grants.ownerInviteAcceptedTitle")
                          : t("grants.ownerInviteDeclinedTitle")}
                      </Text>
                    </View>
                    <Text muted mono style={styles.cardTime}>
                      {formatTimestamp(createdAt, t)}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      <Ionicons
                        name="person-add"
                        size={18}
                        color="rgba(255,255,255,0.25)"
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text muted mono style={styles.badgeText}>
                        {t("transfers.badgeOutgoing")}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {t("grants.title")}
                      </Text>
                      <Text dim style={styles.cardBody}>
                        {label}
                      </Text>
                    </View>
                  </View>
                  {canOpen ? (
                    <Text style={styles.linkText}>{t("transfers.viewBelonging")}</Text>
                  ) : null}
                </Container>
              );
            }
            if (row.kind === "transferLocal") {
              const e = row.e;
              const status = e.outcome;
              const titleLine = e.title || t("transfers.requestTitleFallback");
              const createdAt = parseIsoDate(e.createdAt);
              const badge =
                status === "accepted"
                  ? t("transfers.badgeYouAccepted")
                  : t("transfers.badgeYouDeclined");
              const acceptGreen = "#39D98A";
              const body =
                status === "accepted"
                  ? t("transfers.incomingAcceptedBody")
                  : t("transfers.incomingDeclinedBody");
              const canOpen = status === "accepted" && Boolean(e.belongingId);
              const Container = canOpen ? Pressable : View;
              const containerProps = canOpen
                ? {
                    onPress: () =>
                      router.push(
                        (`/belonging/${encodeURIComponent(e.belongingId!)}` as unknown) as any,
                      ),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      styles.cardIncomingAccepted,
                      pressed && { opacity: 0.92 },
                    ],
                  }
                : { style: [styles.card, styles.cardIncomingAccepted] };

              return (
                <Container key={`tl:${e.id}`} {...(containerProps as any)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={status === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={
                          status === "accepted"
                            ? acceptGreen
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
                      {formatTimestamp(createdAt, t)}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <View style={styles.thumb}>
                      <Ionicons
                        name="swap-horizontal"
                        size={18}
                        color="rgba(255,255,255,0.25)"
                      />
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

            const it = row.item;
            if (it.kind === "incomingUpdate") {
              const r = it.req;
              const status = it.status;
              const titleLine = r.title || t("transfers.requestTitleFallback");
              const thumbUri = normalizePhotoUri(r.photoUrl);
              const badge =
                status === "accepted"
                  ? t("transfers.badgeYouAccepted")
                  : t("transfers.badgeYouDeclined");
              const acceptGreen = "#39D98A"; // You accepted (incoming)
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
                            ? acceptGreen
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
              const acceptGreen = "#7CFFB9"; // They accepted (outgoing)
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
                            ? acceptGreen
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
                    onPress={() => void onAccept(r)}
                    disabled={busyId === r._id}
                  />
                  <Button
                    title={t("transfers.decline")}
                    variant="outline"
                    onPress={() => void onDecline(r)}
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
    borderColor: "rgba(80, 190, 255, 0.22)", // distinct green-ish/teal accent vs incoming
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

