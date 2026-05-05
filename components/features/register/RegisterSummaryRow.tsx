import { Text } from "@/components/common_components/Text";
import { View } from "react-native";

import { registerStyles as s } from "./registerStyles";

export function RegisterSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={s.summaryRow}>
      <Text muted mono style={s.summaryLabel}>
        {label}
      </Text>
      <Text style={s.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
