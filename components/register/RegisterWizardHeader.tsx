import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { registerStyles as s } from "./registerStyles";
import type { WizardStep } from "./registerTypes";

import type { TranslationKey } from "@/src/i18n/types";

type T = (key: TranslationKey) => string;

function ProgressRow({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={s.progressRow}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[s.progressSeg, i < filled && s.progressSegOn]} />
      ))}
    </View>
  );
}

export function RegisterWizardHeader({
  t,
  step,
  filledSegments,
  onBack,
  onCancelRegistration,
}: {
  t: T;
  step: WizardStep;
  filledSegments: number;
  onBack: () => void;
  onCancelRegistration: () => void;
}) {
  return (
    <>
      <View style={s.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.backBtn}>
          <Text style={s.backText}>{t("registerFlow.back")}</Text>
        </Pressable>
        <Text mono style={s.headerTitle}>
          {t("registerFlow.headerTitle")}
        </Text>
        <View style={{ width: 72 }} />
      </View>

      <ProgressRow filled={filledSegments} total={3} />

      {step !== "intro" ? (
        <Pressable onPress={onCancelRegistration} style={s.cancelRow}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
          <Text muted style={s.cancelText}>
            {t("registerFlow.cancelRegistration")}
          </Text>
        </Pressable>
      ) : (
        <View style={{ height: 28 }} />
      )}
    </>
  );
}
