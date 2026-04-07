import { Text } from "@/components/common_components/Text";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function BelongingPrimaryActions({
  onTransfer,
  onGrant,
  onReportStolen,
}: {
  onTransfer: () => void;
  onGrant: () => void;
  onReportStolen: () => void;
}) {
  return (
    <View>
      <View style={styles.actionsRow}>
        <Pressable onPress={onTransfer} style={[styles.actionBtn, styles.primaryBtn]}>
          <Text style={styles.primaryBtnText}>TRANSFER</Text>
        </Pressable>
        <Pressable onPress={onGrant} style={[styles.actionBtn, styles.secondaryBtn]}>
          <Text style={styles.secondaryBtnText}>GRANT</Text>
        </Pressable>
      </View>

      <Pressable onPress={onReportStolen} style={styles.reportBtn}>
        <Text style={styles.reportBtnText}>REPORT STOLEN</Text>
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
  primaryBtnText: {
    color: "rgba(255,255,255,0.92)",
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
});

