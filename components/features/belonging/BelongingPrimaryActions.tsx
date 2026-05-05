import { Text } from "@/components/common_components/Text";
import type { TranslationKey } from "@/src/i18n/types";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function BelongingPrimaryActions({
  t,
  onTransfer,
  onCancelTransfer,
  onGrant,
  onReportStolen,
  transferPending = false,
  transferBusy = false,
  stolen,
  reportBusy = false,
}: {
  t: (k: TranslationKey) => string;
  onTransfer: () => void;
  onCancelTransfer?: () => void;
  onGrant: () => void;
  onReportStolen: () => void;
  transferPending?: boolean;
  transferBusy?: boolean;
  stolen: boolean;
  reportBusy?: boolean;
}) {
  return (
    <View>
      <View style={styles.actionsRow}>
        <Pressable
          onPress={transferPending ? onCancelTransfer : onTransfer}
          disabled={transferBusy || (transferPending && !onCancelTransfer)}
          style={[
            styles.actionBtn,
            transferPending ? styles.dangerBtn : styles.primaryBtn,
            transferBusy && { opacity: 0.6 },
          ]}
        >
          <Text style={transferPending ? styles.dangerBtnText : styles.primaryBtnText}>
            {transferPending ? t("vault.actionCancelTransfer") : t("vault.actionTransfer")}
          </Text>
        </Pressable>
        <Pressable onPress={onGrant} style={[styles.actionBtn, styles.secondaryBtn]}>
          <Text style={styles.secondaryBtnText}>{t("vault.actionGrant")}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onReportStolen}
        disabled={reportBusy}
        style={[styles.reportBtn, stolen && styles.notStolenBtn]}
      >
        <Text
          style={[
            styles.reportBtnText,
            stolen && styles.notStolenBtnText,
            reportBusy && { opacity: 0.6 },
          ]}
        >
          {stolen ? t("vault.actionMarkNotStolen") : t("vault.actionReportStolen")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  dangerBtn: {
    backgroundColor: "rgba(255, 75, 160, 0.06)",
    borderWidth: 2,
    borderColor: "rgba(255, 75, 160, 0.85)",
  },
  primaryBtnText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },
  dangerBtnText: {
    color: "rgba(255, 75, 160, 0.95)",
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  secondaryBtnText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },
  reportBtn: {
    marginTop: 14,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 75, 160, 0.85)",
    backgroundColor: "rgba(255, 75, 160, 0.06)",
  },
  reportBtnText: {
    color: "rgba(255, 75, 160, 0.95)",
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 14,
  },
  notStolenBtn: {
    borderColor: "rgba(42, 214, 110, 0.85)",
    backgroundColor: "rgba(42, 214, 110, 0.08)",
  },
  notStolenBtnText: {
    color: "rgba(42, 214, 110, 0.95)",
  },
});

