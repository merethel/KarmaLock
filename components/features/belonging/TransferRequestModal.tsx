import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import { ActionSheetModal } from "@/components/features/belonging/ActionSheetModal";
import { RecipientEmailPicker } from "@/components/features/belonging/RecipientEmailPicker";
import type { Belonging } from "@/src/api/belongings";
import { requestTransfer } from "@/src/api/transfers";
import { useI18n } from "@/src/i18n/context";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import { setBelongingTransferStatus } from "@/src/state/belongingCache";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native";

export function TransferRequestModal({
  visible,
  item,
  onClose,
  presetToEmail,
  presetGrantId,
}: {
  visible: boolean;
  item: Belonging | null;
  onClose: () => void;
  /** Pre-filled recipient (e.g. active grantee chosen from sharing). */
  presetToEmail?: string;
  /** Sent with the request when transferring ownership to an existing grantee. */
  presetGrantId?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const [transferEmail, setTransferEmail] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTransferEmail((presetToEmail ?? "").trim());
    setTransferNote("");
    setTransferBusy(false);
  }, [visible, presetToEmail]);

  const canSend =
    Boolean(item?._id) && Boolean(transferEmail.trim()) && !transferBusy;

  return (
    <ActionSheetModal
      visible={visible}
      busy={transferBusy}
      title={t("transfers.requestTitle")}
      icon="swap-horizontal"
      onClose={onClose}
      footer={
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
                    grantId: presetGrantId?.trim() || undefined,
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
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text dim style={styles.hint}>
          {presetToEmail?.trim()
            ? t("transfers.presetGranteeHint")
            : t("transfers.requestHint")}
        </Text>

        <RecipientEmailPicker
          value={transferEmail}
          onChange={setTransferEmail}
          disabled={transferBusy}
          label={t("transfers.emailLabel")}
          placeholder={t("transfers.emailPlaceholder")}
          tSearching={t("transfers.searchingEmail")}
          tEmailNotFound={t("transfers.emailNotFound")}
        />

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
    </ActionSheetModal>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
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
  },
});
