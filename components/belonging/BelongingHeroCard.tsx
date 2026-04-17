import { Text } from "@/components/common_components/Text";
import type { Belonging } from "@/src/api/belongings";
import type { TranslationKey } from "@/src/i18n/types";
import {
  getBelongingGrantStatus,
  getBelongingTransferStatus,
} from "@/src/state/belongingCache";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

function Pill({
  label,
  icon,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.pill}>
      {icon ? (
        <Ionicons name={icon} size={14} color="rgba(255,255,255,0.9)" />
      ) : null}
      <Text mono style={styles.pillText}>
        {label}
      </Text>
    </View>
  );
}

export function BelongingHeroCard({
  t,
  item,
  valueLabel,
  sharing,
  onPressSharing,
}: {
  t: (k: TranslationKey) => string;
  item: Belonging;
  valueLabel: string;
  sharing?: {
    avatars: {
      key: string;
      initials: string;
      dim?: boolean;
      bg?: string;
      border?: string;
    }[];
  };
  onPressSharing?: () => void;
}) {
  const isTransferring = getBelongingTransferStatus(item._id) === "transferring";
  const isGranting = getBelongingGrantStatus(item._id) === "granting";
  const statusLabel = isTransferring
    ? t("vault.statusTransferring")
    : isGranting
      ? t("vault.statusGranting")
      : item.isStolen
        ? t("vault.statusStolen")
        : t("vault.statusOk");

  return (
    <View style={styles.heroCard}>
      <Text mono style={styles.idLine}>
        ID // {item.chipUid}
      </Text>
      <Text style={styles.heroTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.heroPills}>
          <Pill label={statusLabel} />
          <Pill label={valueLabel} icon="cash-outline" />
        </View>

        {sharing?.avatars?.length ? (
          <Pressable
            onPress={onPressSharing}
            disabled={!onPressSharing}
            hitSlop={10}
            style={({ pressed }) => [
              styles.avatarStack,
              pressed && onPressSharing && { opacity: 0.9 },
            ]}
            accessibilityRole={onPressSharing ? "button" : undefined}
            accessibilityLabel={onPressSharing ? "Sharing" : undefined}
          >
            {sharing.avatars.slice(0, 4).map((a, idx) => (
              <View
                key={a.key}
                style={[
                  styles.avatar,
                  a.dim && { opacity: 0.55 },
                  a.bg ? { backgroundColor: a.bg } : null,
                  a.border ? { borderColor: a.border } : null,
                  { marginLeft: idx === 0 ? 0 : -8 },
                ]}
              >
                <Text mono style={styles.avatarText}>
                  {a.initials}
                </Text>
              </View>
            ))}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 20,
    marginTop: -72,
    padding: 18,
    gap: 10,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  idLine: { color: "rgba(255,255,255,0.78)", letterSpacing: 2, fontSize: 14 },
  heroTitle: {
    color: "rgba(255,255,255,0.98)",
    fontWeight: "900",
    fontSize: 32,
    letterSpacing: 0.2,
  },
  heroPills: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pillText: {
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 1.4,
    fontSize: 14,
    fontWeight: "900",
  },

  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.92)",
  },
});

