import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import type { Belonging } from "@/src/api/belongings";
import { requestTransfer } from "@/src/api/transfers";
import type { UserSuggestion } from "@/src/api/users";
import { suggestUsersByEmail } from "@/src/api/users";
import { useI18n } from "@/src/i18n/context";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import { setBelongingTransferStatus } from "@/src/state/belongingCache";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export function TransferRequestModal({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: Belonging | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();

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

  useEffect(() => {
    if (!visible) return;
    setTransferEmail("");
    setTransferNote("");
    setTransferBusy(false);
    setEmailBusy(false);
    setEmailError("");
    setEmailSuggestions([]);
    setEmailTouched(false);
    setEmailLocked(false);
    setLockedEmail("");
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (emailLocked) return;
    const q = transferEmail.trim();
    setEmailError("");

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
          if (seq !== emailReqSeq.current) return;
          setEmailSuggestions([]);
        } finally {
          if (seq !== emailReqSeq.current) return;
          setEmailBusy(false);
        }
      })();
    }, 250);

    return () => clearTimeout(handle);
  }, [emailLocked, transferEmail, visible, t]);

  const canSend = Boolean(item?._id) && Boolean(transferEmail.trim()) && !transferBusy;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={transferBusy ? undefined : onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={
          transferBusy
            ? undefined
            : () => {
                Keyboard.dismiss();
              }
        }
      >
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.sheet}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <View style={styles.topRow}>
              <View style={styles.topLeft}>
                <Ionicons
                  name="swap-horizontal"
                  size={18}
                  color="rgba(255,255,255,0.70)"
                />
                <Text style={styles.title}>{t("transfers.requestTitle")}</Text>
              </View>
              <Pressable
                hitSlop={10}
                disabled={transferBusy}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
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
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <Text dim style={styles.hint}>
                {t("transfers.requestHint")}
              </Text>

              <Text muted mono style={styles.label}>
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
                style={styles.input}
                editable={!transferBusy}
                autoFocus
                returnKeyType="next"
              />

              {emailBusy && !emailLocked ? (
                <Text dim style={styles.helperText}>
                  {t("transfers.searchingEmail")}
                </Text>
              ) : null}

              {!emailLocked && emailSuggestions.length > 0 ? (
                <View style={styles.suggestionsBox}>
                  <View style={styles.suggestionsContent}>
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
                          styles.suggestionRow,
                          pressed && { opacity: 0.88 },
                        ]}
                      >
                        <Ionicons
                          name="person-circle-outline"
                          size={18}
                          color="rgba(255,255,255,0.65)"
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.suggestionPrimary} numberOfLines={1}>
                            {u.name || u.email}
                          </Text>
                          {u.name ? (
                            <Text
                              dim
                              style={styles.suggestionSecondary}
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
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <Text muted mono style={[styles.label, { marginTop: 10 }]}>
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
                style={[styles.input, styles.noteInput]}
                editable={!transferBusy}
                maxLength={280}
              />
            </ScrollView>

            <View style={styles.actionsRow}>
              <Button
                title={transferBusy ? t("transfers.scanning") : t("transfers.send")}
                disabled={!canSend}
                style={{ height: 44, flex: 1 }}
                textStyle={{ fontSize: 14 }}
                onPress={() => {
                  void (async () => {
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
                        note: transferNote.trim() ? transferNote.trim() : undefined,
                        chipUid: scanned,
                      });

                      setBelongingTransferStatus(item._id, "transferring");
                      onClose();
                      router.replace("/vault");
                    } catch (e: unknown) {
                      Alert.alert(
                        t("errors.failed"),
                        e instanceof Error ? e.message : t("errors.failed"),
                      );
                    } finally {
                      setTransferBusy(false);
                    }
                  })();
                }}
              />
              <Button
                title={t("transfers.cancel")}
                variant="outline"
                disabled={transferBusy}
                style={{ height: 44, width: 120 }}
                textStyle={{ fontSize: 14 }}
                onPress={onClose}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  title: { fontSize: 18, fontWeight: "900" },
  formScroll: { flexGrow: 0 },
  formScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  helperText: { marginTop: 10 },
  errorText: { marginTop: 10, color: "tomato" },
  label: { letterSpacing: 2.4, fontSize: 11, marginBottom: 8 },
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

