import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { TransferRequest } from "@/src/api/transfers";
import {
  acceptTransfer,
  declineTransfer,
  listIncomingTransfers,
  listOutgoingTransfers,
} from "@/src/api/transfers";
import { useI18n } from "@/src/i18n/context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  hasSeenTransferUpdate,
  markSeenTransferUpdate,
} from "@/src/state/seenTransferUpdates";

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

  const outgoingUpdates = useMemo(() => {
    return (outgoing ?? []).filter((r) => {
      const status = (r.status ?? "pending") as string;
      return status === "accepted" || status === "declined";
    });
  }, [outgoing]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [inc, out] = await Promise.all([
        listIncomingTransfers(),
        listOutgoingTransfers(),
      ]);
      setRequests(inc.data.requests ?? []);
      setOutgoing(out.data.requests ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
      // Mark all sender-side updates as seen when opening notifications.
      // This makes the bell badge clear naturally.
      // (In-memory only; resets on app reload.)
      void (async () => {
        try {
          const out = await listOutgoingTransfers();
          const list = out.data.requests ?? [];
          for (const r of list) {
            const status = (r.status ?? "pending") as string;
            if (status !== "accepted" && status !== "declined") continue;
            markSeenTransferUpdate(r._id, status);
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
        await acceptTransfer(id);
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
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{t("registerFlow.back")}</Text>
        </Pressable>
        <Text mono style={styles.headerTitle}>
          {t("transfers.title")}
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
      ) : pending.length === 0 && outgoingUpdates.length === 0 ? (
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

          {outgoingUpdates.length > 0 ? (
            <>
              <Text muted mono style={styles.sectionLabel}>
                {t("transfers.updatesTitle")}
              </Text>
              {outgoingUpdates.map((r) => {
                const status = (r.status ?? "pending") as string;
                const label =
                  status === "accepted"
                    ? t("transfers.updateAccepted")
                        .replace("{{name}}", r.toUser?.name || r.toUser?.email || "—")
                        .replace("{{title}}", r.title || "item")
                    : t("transfers.updateDeclined")
                        .replace("{{name}}", r.toUser?.name || r.toUser?.email || "—")
                        .replace("{{title}}", r.title || "item");

                const seen = hasSeenTransferUpdate(r._id, status);

                return (
                  <View key={`${r._id}:${status}`} style={styles.card}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons
                        name={status === "accepted" ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={status === "accepted" ? "#39D98A" : "rgba(255,120,120,0.95)"}
                      />
                      <Text style={styles.cardTitle}>
                        {status === "accepted"
                          ? t("transfers.acceptedToastTitle")
                          : t("transfers.declinedTitle")}
                      </Text>
                      {!seen ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text dim style={styles.cardBody}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </>
          ) : null}

          {pending.map((r) => (
            <View key={r._id} style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="swap-horizontal" size={18} color={palette.accent} />
                <Text style={styles.cardTitle}>
                  {r.title || t("transfers.requestTitleFallback")}
                </Text>
              </View>

              <Text dim style={styles.cardBody}>
                {t("transfers.requestBody")
                  .replace("{{from}}", r.fromUser?.name || r.fromUser?.email || "—")
                }
              </Text>

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
          ))}
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
  backBtn: { paddingVertical: 6, width: 72 },
  backText: { color: "rgba(255,255,255,0.85)", fontSize: 15 },
  headerTitle: {
    fontSize: 12,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  sectionLabel: { letterSpacing: 2.6, fontSize: 11, marginTop: 6, marginBottom: 2 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", flex: 1 },
  cardBody: { lineHeight: 20 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.accent,
    opacity: 0.95,
  },
});

