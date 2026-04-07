import { useCountdown } from "@/hooks/useCountdown";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Button } from "./Button";
import { Text } from "./Text";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;

  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;

  countdownSeconds?: number;
  waitLabel?: (secondsLeft: number) => string;
};

export function DangerConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  body,
  cancelLabel,
  confirmLabel,
  countdownSeconds = 3,
  waitLabel,
}: Props) {
  const [busy, setBusy] = useState(false);
  const secondsLeft = useCountdown(visible, countdownSeconds);

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
          <Text style={styles.title}>{title}</Text>
          <Text dim style={styles.body}>
            {body}
          </Text>

          <View style={styles.actions}>
            <Button
              title={cancelLabel}
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
                    ? waitLabel
                      ? waitLabel(secondsLeft)
                      : `Wait ${secondsLeft} s`
                    : confirmLabel}
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
