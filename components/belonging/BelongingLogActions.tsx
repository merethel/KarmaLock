import { Text } from "@/components/common_components/Text";
import type { TranslationKey } from "@/src/i18n/types";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function BelongingLogActions({
  t,
  onShowHistory,
  onTestAlert,
  onGetReport,
  onAddDoc,
}: {
  t: (k: TranslationKey) => string;
  onShowHistory: () => void;
  onTestAlert: () => void;
  onGetReport: () => void;
  onAddDoc: () => void;
}) {
  return (
    <View style={styles.stack}>
      <Pressable onPress={onShowHistory} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>{t("vault.showEditHistory")}</Text>
      </Pressable>
      <Pressable onPress={onTestAlert} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>{t("vault.testAlertSystem")}</Text>
      </Pressable>
      <Pressable onPress={onGetReport} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>{t("vault.getReport")}</Text>
      </Pressable>
      <Pressable onPress={onAddDoc} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>{t("vault.addDoc")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: 54,
    gap: 10,
  },
  actionBtn: {
    height: 46,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actionBtnText: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 12,
  },
});
