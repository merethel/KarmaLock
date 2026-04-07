import { Text } from "@/components/common_components/Text";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function BelongingLogActions({
  onTestAlert,
  onGetReport,
  onAddDoc,
}: {
  onTestAlert: () => void;
  onGetReport: () => void;
  onAddDoc: () => void;
}) {
  return (
    <View>
      <Pressable onPress={onTestAlert} style={styles.testBtn}>
        <Text style={styles.testBtnText}>TEST ALERT SYSTEM</Text>
      </Pressable>

      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>LOG</Text>
        <View style={styles.logActions}>
          <Pressable onPress={onGetReport} style={styles.smallPill}>
            <Text style={styles.smallPillText}>GET REPORT</Text>
          </Pressable>
          <Pressable onPress={onAddDoc} style={styles.smallPillDark}>
            <Text style={styles.smallPillDarkText}>+ ADD DOC</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  testBtn: {
    marginTop: 54,
    marginBottom: 10,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  testBtnText: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 12,
  },
  logHeader: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logTitle: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.2,
    fontSize: 14,
  },
  logActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  smallPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  smallPillText: {
    color: "rgba(0,0,0,0.9)",
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 11,
  },
  smallPillDark: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  smallPillDarkText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 11,
  },
});
