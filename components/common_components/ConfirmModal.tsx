import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";

import { palette } from "@/constants/Colors";
import { Button } from "./Button";
import { Text } from "./Text";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;

  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
};

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  body,
  cancelLabel,
  confirmLabel,
}: Props) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible]);

  async function handleConfirm() {
    if (busy) return;
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
              disabled={busy}
              onPress={() => void handleConfirm()}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && !busy && { opacity: 0.92 },
                busy && { opacity: 0.7 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
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
  confirmBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});

