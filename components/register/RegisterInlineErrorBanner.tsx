import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { registerStyles as s } from "./registerStyles";

export function RegisterInlineErrorBanner({
  title,
  message,
  compact,
}: {
  title: string;
  message: string;
  compact?: boolean;
}) {
  if (!message.trim()) return null;

  return (
    <View
      style={[s.errorBanner, compact && s.errorBannerCompact]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle" size={22} color="#ff8a8a" />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={s.errorBannerTitle}>{title}</Text>
        <Text style={s.errorBannerBody}>{message}</Text>
      </View>
    </View>
  );
}
