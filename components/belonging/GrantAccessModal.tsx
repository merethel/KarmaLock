import { ActionSheetModal } from "@/components/belonging/ActionSheetModal";
import { RecipientEmailPicker } from "@/components/belonging/RecipientEmailPicker";
import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import type { Belonging } from "@/src/api/belongings";
import { createGrant } from "@/src/api/grants";
import { useI18n } from "@/src/i18n/context";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export function GrantAccessModal({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: Belonging | null;
  onClose: () => void;
}) {
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEmail("");
    setBusy(false);
  }, [visible]);

  const canGrant = Boolean(item?._id) && Boolean(email.trim()) && !busy;

  return (
    <ActionSheetModal
      visible={visible}
      busy={busy}
      title={t("grants.title")}
      icon={"person-add" as React.ComponentProps<typeof Ionicons>["name"]}
      onClose={onClose}
      footer={
        <View style={styles.actionsRow}>
          <Button
            title={busy ? t("grants.scanning") : t("grants.grant")}
            disabled={!canGrant}
            style={{ height: 44, flex: 1 }}
            textStyle={{ fontSize: 14 }}
            onPress={() => {
              void (async () => {
                if (!item?._id) return;
                try {
                  setBusy(true);
                  const normalizeChipUid = (v: string) => v.trim().toLowerCase();
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
                      t("grants.chipMismatchTitle"),
                      t("grants.chipMismatchBody"),
                    );
                    return;
                  }

                  await createGrant({
                    belongingId: item._id,
                    toEmail: email.trim(),
                    chipUid: scanned,
                  });

                  onClose();
                } catch (e: unknown) {
                  Alert.alert(
                    t("errors.failed"),
                    e instanceof Error ? e.message : t("errors.failed"),
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
          />
          <Button
            title={t("grants.cancel")}
            variant="outline"
            disabled={busy}
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
          {t("grants.hint")}
        </Text>

        <RecipientEmailPicker
          value={email}
          onChange={setEmail}
          disabled={busy}
          label={t("grants.emailLabel")}
          placeholder={t("grants.emailPlaceholder")}
          tSearching={t("grants.searchingEmail")}
          tEmailNotFound={t("grants.emailNotFound")}
        />
      </ScrollView>
    </ActionSheetModal>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  actionsRow: { flexDirection: "row", gap: 10 },
});

