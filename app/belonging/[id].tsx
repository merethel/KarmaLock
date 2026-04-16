import { BelongingAttributesCard } from "@/components/belonging/BelongingAttributesCard";
import { BelongingHeroCard } from "@/components/belonging/BelongingHeroCard";
import { BelongingHeroHeader } from "@/components/belonging/BelongingHeroHeader";
import { BelongingLogActions } from "@/components/belonging/BelongingLogActions";
import { BelongingPrimaryActions } from "@/components/belonging/BelongingPrimaryActions";
import { Button } from "@/components/common_components/Button";
import { DangerConfirmModal } from "@/components/common_components/DangerConfirmModal";
import { DangerRow } from "@/components/common_components/DangerRow";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import type { Belonging } from "@/src/api/belongings";
import {
  deleteBelonging,
  listMyBelongings,
  updateBelonging,
} from "@/src/api/belongings";
import { requestTransfer } from "@/src/api/transfers";
import type { UserSuggestion } from "@/src/api/users";
import { suggestUsersByEmail } from "@/src/api/users";
import { useI18n } from "@/src/i18n/context";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import {
  getCachedBelonging,
  setBelongingTransferStatus,
} from "@/src/state/belongingCache";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
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

  const idStr = typeof id === "string" ? id : "";
  const cached = useMemo(
    () => (idStr ? getCachedBelonging(idStr) : null),
    [idStr],
  );
  const [item, setItem] = useState<Belonging | null>(() => cached);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState("");
  const [transferredAway, setTransferredAway] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stolenOpen, setStolenOpen] = useState(false);
  const [markBusy, setMarkBusy] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<UserSuggestion[]>([]);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState("");
  const emailReqSeq = useRef(0);

  // If the route param arrives after first render, paint from cache immediately.
  useEffect(() => {
    if (!cached) return;
    setItem((prev) => prev ?? cached);
    setLoading(false);
  }, [cached]);

  const load = useCallback(async () => {
    try {
      setError("");
      setTransferredAway(false);
      // If we already have something to render (from cache), refresh silently.
      if (!item) setLoading(true);
      const res = await listMyBelongings();
      const found = (res.data.items || []).find((x) => x._id === idStr) ?? null;
      setItem(found);
      if (!found) setTransferredAway(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      if (!item) setLoading(false);
    }
  }, [idStr, item, t]);

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

  const onTransfer = () => {
    setTransferEmail("");
    setTransferNote("");
    setEmailBusy(false);
    setEmailError("");
    setEmailSuggestions([]);
    setEmailTouched(false);
    setEmailLocked(false);
    setLockedEmail("");
    setTransferOpen(true);
  };
  const onGrant = () => Alert.alert("Grant", "Not implemented yet.");
  const onReportStolen = useCallback(async () => {
    if (!item?._id) return;
    if (item.isStolen) {
      // Unmark should be instant (no modal).
      try {
        setMarkBusy(true);
        const res = await updateBelonging(item._id, { isStolen: false });
        setItem(res.data.item);
      } catch (e: unknown) {
        Alert.alert(
          t("errors.failed"),
          e instanceof Error ? e.message : t("errors.failed"),
        );
      } finally {
        setMarkBusy(false);
      }
      return;
    }
    setStolenOpen(true);
  }, [item?._id, item?.isStolen, t]);
  const onAddDoc = () => Alert.alert("Add doc", "Not implemented yet.");

  useEffect(() => {
    if (!transferOpen) return;
    if (emailLocked) return;
    const q = transferEmail.trim();
    setEmailError("");

    // Avoid spamming backend for short inputs.
    if (q.length < 3) {
      setEmailSuggestions([]);
      setEmailBusy(false);
      return;
    }

    const handle = setTimeout(() => {
      void (async () => {
        const seq = ++emailReqSeq.current;
        try {
          setEmailBusy(true);
          const res = await suggestUsersByEmail(q);
          const users = res.data.users ?? [];
          if (seq !== emailReqSeq.current) return;
          setEmailSuggestions(users);
          if (q.includes("@") && users.length === 0) {
            setEmailError(t("transfers.emailNotFound"));
          }
        } catch {
          // If suggestions fail, don't block transfer; backend will validate on send.
          if (seq !== emailReqSeq.current) return;
          setEmailSuggestions([]);
        } finally {
          if (seq !== emailReqSeq.current) return;
          setEmailBusy(false);
        }
      })();
    }, 300);

    return () => clearTimeout(handle);
  }, [emailLocked, transferEmail, transferOpen, t]);

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
      ) : transferredAway ? (
        <View style={styles.center}>
          <View style={styles.transferredCard}>
            <Ionicons
              name="swap-horizontal"
              size={28}
              color="rgba(255,255,255,0.65)"
            />
            <Text style={styles.transferredTitle}>
              {t("vault.transferredAwayTitle")}
            </Text>
            <Text dim style={styles.transferredBody}>
              {t("vault.transferredAwayBody")}
            </Text>
            <View style={{ marginTop: 14, width: 220 }}>
              <Button
                title={t("vault.goBackToVault")}
                onPress={() => router.replace("/vault")}
              />
            </View>
          </View>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <View style={{ marginTop: 14, width: 220, gap: 10 }}>
            <Button title={t("vault.tryAgain")} onPress={load} />
            <Button
              title={t("registerFlow.back")}
              variant="outline"
              onPress={() => router.replace("/vault")}
            />
          </View>
        </View>
      ) : !item ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t("errors.failed")}</Text>
          <View style={{ marginTop: 14, width: 220, gap: 10 }}>
            <Button title={t("vault.tryAgain")} onPress={load} />
            <Button
              title={t("registerFlow.back")}
              variant="outline"
              onPress={() => router.replace("/vault")}
            />
          </View>
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
                  stolen={Boolean(item?.isStolen)}
                  reportBusy={markBusy}
                />

                <BelongingAttributesCard
                  t={t}
                  item={item}
                  onEdit={() =>
                    router.push(`/belonging/${item._id}/edit` as unknown as any)
                  }
                />
                <BelongingLogActions
                  t={t}
                  onShowHistory={() =>
                    router.push(
                      `/belonging/${item._id}/history` as unknown as any,
                    )
                  }
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

      <DangerConfirmModal
        visible={stolenOpen}
        onClose={() => setStolenOpen(false)}
        onConfirm={async () => {
          try {
            if (!item?._id) return;
            const res = await updateBelonging(item._id, {
              isStolen: !item.isStolen,
            });
            setItem(res.data.item);
          } catch (e: unknown) {
            Alert.alert(
              t("errors.failed"),
              e instanceof Error ? e.message : t("errors.failed"),
            );
          } finally {
            setStolenOpen(false);
          }
        }}
        title={
          item?.isStolen
            ? t("vault.markNotStolenModalTitle")
            : t("vault.reportStolenModalTitle")
        }
        body={
          item?.isStolen
            ? t("vault.markNotStolenModalBody")
            : t("vault.reportStolenModalBody")
        }
        cancelLabel={
          item?.isStolen
            ? t("vault.markNotStolenModalCancel")
            : t("vault.reportStolenModalCancel")
        }
        confirmLabel={
          item?.isStolen
            ? t("vault.markNotStolenModalConfirm")
            : t("vault.reportStolenModalConfirm")
        }
        countdownSeconds={0}
      />

      <Modal
        visible={transferOpen}
        transparent
        animationType="fade"
        onRequestClose={transferBusy ? undefined : () => setTransferOpen(false)}
      >
        <Pressable
          style={modalStyles.backdrop}
          onPress={
            transferBusy
              ? undefined
              : () => {
                  // Tap outside input: dismiss keyboard (keep modal open).
                  Keyboard.dismiss();
                }
          }
        >
          <KeyboardAvoidingView
            style={modalStyles.kav}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Pressable
              style={modalStyles.sheet}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <View style={modalStyles.topRow}>
                <View style={modalStyles.topLeft}>
                  <Ionicons
                    name="swap-horizontal"
                    size={18}
                    color="rgba(255,255,255,0.70)"
                  />
                  <Text style={modalStyles.title}>
                    {t("transfers.requestTitle")}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  disabled={transferBusy}
                  onPress={() => setTransferOpen(false)}
                  style={({ pressed }) => [
                    modalStyles.closeBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="rgba(255,255,255,0.75)"
                  />
                </Pressable>
              </View>

              <ScrollView
                style={modalStyles.formScroll}
                contentContainerStyle={modalStyles.formScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                <Text dim style={modalStyles.hint}>
                  {t("transfers.requestHint")}
                </Text>

                <Text muted mono style={modalStyles.label}>
                  {t("transfers.emailLabel")}
                </Text>

                <TextInput
                  value={transferEmail}
                  onChangeText={(v) => {
                    const next = v;
                    const prevLocked = emailLocked;
                    setTransferEmail(v);
                    setEmailTouched(true);
                    if (prevLocked) {
                      const a = lockedEmail.trim().toLowerCase();
                      const b = next.trim().toLowerCase();
                      if (a && b && a === b) return;
                      setEmailLocked(false);
                    }
                  }}
                  placeholder={t("transfers.emailPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={modalStyles.input}
                  editable={!transferBusy}
                  autoFocus
                  returnKeyType="next"
                />

                {emailBusy && !emailLocked ? (
                  <Text dim style={modalStyles.helperText}>
                    {t("transfers.searchingEmail")}
                  </Text>
                ) : null}

                {!emailLocked && emailSuggestions.length > 0 ? (
                  <View style={modalStyles.suggestionsBox}>
                    <View style={modalStyles.suggestionsContent}>
                      {emailSuggestions.slice(0, 3).map((u) => (
                        <Pressable
                          key={u.id}
                          disabled={transferBusy}
                          onPress={() => {
                            setTransferEmail(u.email);
                            setEmailSuggestions([]);
                            setEmailError("");
                            setEmailLocked(true);
                            setLockedEmail(u.email);
                            Keyboard.dismiss();
                          }}
                          style={({ pressed }) => [
                            modalStyles.suggestionRow,
                            pressed && { opacity: 0.88 },
                          ]}
                        >
                          <Ionicons
                            name="person-circle-outline"
                            size={18}
                            color="rgba(255,255,255,0.65)"
                          />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={modalStyles.suggestionPrimary}
                              numberOfLines={1}
                            >
                              {u.name || u.email}
                            </Text>
                            {u.name ? (
                              <Text
                                dim
                                style={modalStyles.suggestionSecondary}
                                numberOfLines={1}
                              >
                                {u.email}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {!emailLocked && !emailBusy && emailTouched && emailError ? (
                  <Text style={modalStyles.errorText}>{emailError}</Text>
                ) : null}

                <Text muted mono style={[modalStyles.label, { marginTop: 10 }]}>
                  {t("transfers.noteLabel")}
                </Text>
                <TextInput
                  value={transferNote}
                  onChangeText={setTransferNote}
                  placeholder={t("transfers.notePlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  autoCapitalize="sentences"
                  autoCorrect
                  multiline
                  style={[modalStyles.input, modalStyles.noteInput]}
                  editable={!transferBusy}
                  maxLength={280}
                />
              </ScrollView>

              <View style={modalStyles.actionsRow}>
                <Button
                  title={transferBusy ? t("transfers.scanning") : t("transfers.send")}
                  disabled={transferBusy || !transferEmail.trim() || !item?._id}
                  style={{ height: 44, flex: 1 }}
                  textStyle={{ fontSize: 14 }}
                  onPress={async () => {
                    if (!item?._id) return;
                    try {
                      setTransferBusy(true);
                      const normalizeChipUid = (v: string) =>
                        v.trim().toLowerCase();
                      const expected = normalizeChipUid(item.chipUid || "");

                      const scanned = await scanChipUid({
                        iosAlertMessage: t("scan.iosAlertMessage"),
                        nfcUnavailable: t("scan.nfcUnavailable"),
                        nfcNotSupported: t("scan.nfcNotSupported"),
                        noChipIdFound: t("scan.noChipIdFound"),
                      });

                      const got = normalizeChipUid(scanned);
                      if (!expected || !got || expected !== got) {
                        Alert.alert(
                          t("transfers.chipMismatchTitle"),
                          t("transfers.chipMismatchBody"),
                        );
                        return;
                      }

                      await requestTransfer({
                        belongingId: item._id,
                        toEmail: transferEmail.trim(),
                        note: transferNote.trim()
                          ? transferNote.trim()
                          : undefined,
                        chipUid: scanned,
                      });
                      setTransferOpen(false);
                      setBelongingTransferStatus(item._id, "transferring");
                      router.replace("/vault");
                    } catch (e: unknown) {
                      Alert.alert(
                        t("errors.failed"),
                        e instanceof Error ? e.message : t("errors.failed"),
                      );
                    } finally {
                      setTransferBusy(false);
                    }
                  }}
                />
                <Button
                  title={t("transfers.cancel")}
                  variant="outline"
                  disabled={transferBusy}
                  style={{ height: 44, width: 120 }}
                  textStyle={{ fontSize: 14 }}
                  onPress={() => setTransferOpen(false)}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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

  transferredCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
    alignItems: "center",
  },
  transferredTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
  transferredBody: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  kav: { flex: 1, justifyContent: "center" },
  sheet: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#141414",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    maxHeight: "84%",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  formScroll: { flexGrow: 0 },
  formScrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  helperText: { marginTop: 10 },
  errorText: { marginTop: 10, color: "tomato" },
  label: {
    letterSpacing: 2.4,
    fontSize: 11,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
  },
  noteInput: {
    height: 92,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  suggestionsBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  suggestionsContent: { padding: 8, gap: 8 },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  suggestionPrimary: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },
  suggestionSecondary: { fontSize: 12, lineHeight: 16 },
});
