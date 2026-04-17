import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

export function ActionSheetModal({
  visible,
  busy,
  title,
  icon = "swap-horizontal",
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  busy?: boolean;
  title: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const hasHeaderLeft = Boolean((title ?? "").trim()) || Boolean(icon);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={
          busy
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
            <View style={[styles.topRow, !hasHeaderLeft && styles.topRowNoLeft]}>
              {hasHeaderLeft ? (
                <View style={styles.topLeft}>
                  {icon ? (
                    <Ionicons
                      name={icon}
                      size={18}
                      color="rgba(255,255,255,0.70)"
                    />
                  ) : null}
                  {title?.trim() ? <Text style={styles.title}>{title}</Text> : null}
                </View>
              ) : (
                <View />
              )}
              <Pressable
                hitSlop={10}
                disabled={busy}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </View>

            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
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
  topRowNoLeft: {
    justifyContent: "flex-end",
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
  body: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});

