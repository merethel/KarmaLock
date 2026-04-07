import { Text } from "@/components/common_components/Text";
import type { Belonging } from "@/src/api/belongings";
import type { TranslationKey } from "@/src/i18n/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

function asString(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

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
  onEdit,
}: {
  t: (k: TranslationKey) => string;
  item: Belonging;
  onEdit?: () => void;
}) {
  const attrs = item.attributes ?? {};
  const brand = item.brand ?? asString(attrs.brand);
  const model = item.model ?? asString(attrs.model);
  const color = item.color ?? asString(attrs.color);
  const category = item.category ?? asString(attrs.category);
  const serialNumber = item.serialNumber ?? asString(attrs.serialNumber);

  return (
    <View style={[styles.card, onEdit && styles.cardWithEdit]}>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          hitSlop={10}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Edit details"
        >
          <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.75)" />
        </Pressable>
      ) : null}
      <Row label={t("registerFlow.sumBrand")} value={brand} />
      <Row label={t("registerFlow.sumModel")} value={model} />
      <Row label={t("registerFlow.sumColor")} value={color} />
      <Row label={t("registerFlow.sumType")} value={category} />
      <Row label={t("registerFlow.sumSerial")} value={serialNumber} />
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
  cardWithEdit: {
    paddingTop: 16 + 34,
  },
  editBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    zIndex: 2,
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

