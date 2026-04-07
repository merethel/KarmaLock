import { Text } from "@/components/common_components/Text";
import type { Belonging } from "@/src/api/belongings";
import type { TranslationKey } from "@/src/i18n/types";
import React from "react";
import { StyleSheet, View } from "react-native";

function Row({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  const v = (value ?? "").trim();
  return (
    <View style={styles.specRow}>
      <Text mono style={styles.specLabel}>
        {label}
      </Text>
      <Text style={styles.specValue} numberOfLines={2}>
        {v || "—"}
      </Text>
    </View>
  );
}

export function BelongingAttributesCard({
  t,
  item,
}: {
  t: (k: TranslationKey) => string;
  item: Belonging;
}) {
  return (
    <View style={styles.card}>
      <Row label={t("registerFlow.sumBrand")} value={item.brand} />
      <Row label={t("registerFlow.sumModel")} value={item.model} />
      <Row label={t("registerFlow.sumColor")} value={item.color} />
      <Row label={t("registerFlow.sumType")} value={item.category} />
      <Row label={t("registerFlow.sumSerial")} value={item.serialNumber} />
    </View>
  );
}

const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.10)";

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 12,
    marginTop: 6,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  specLabel: {
    width: 120,
    fontSize: 14,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.75)",
  },
  specValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
});

