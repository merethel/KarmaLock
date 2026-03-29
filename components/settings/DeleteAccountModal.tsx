import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import { useCountdown } from "@/hooks/useCountdown";
import type { TranslationKey } from "@/src/i18n/types";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const COUNTDOWN_SEC = 5;

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  t: (key: TranslationKey) => string;
};

export function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  t,
}: Props) {
  const [busy, setBusy] = useState(false);
  const secondsLeft = useCountdown(visible, COUNTDOWN_SEC);

  useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible]);

  const canConfirm = secondsLeft === 0 && !busy;

  async function handleConfirm() {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t("settings.deleteModalTitle")}</Text>
          <Text dim style={styles.body}>
            {t("settings.deleteModalBody")}
          </Text>

          <View style={styles.actions}>
            <Button
              title={t("settings.deleteModalCancel")}
              variant="outline"
              disabled={busy}
              onPress={onClose}
            />
            <Pressable
              disabled={!canConfirm}
              onPress={() => void handleConfirm()}
              style={({ pressed }) => [
                styles.dangerBtn,
                !canConfirm && styles.dangerBtnDisabled,
                pressed && canConfirm && { opacity: 0.9 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.dangerBtnText}>
                  {secondsLeft > 0
                    ? t("settings.deleteModalWait").replace(
                        "{{seconds}}",
                        String(secondsLeft),
                      )
                    : t("settings.deleteModalConfirm")}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
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
  sheet: {
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  actions: { gap: 12 },
  dangerBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerBtnDisabled: {
    backgroundColor: "rgba(198,40,40,0.35)",
  },
  dangerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
