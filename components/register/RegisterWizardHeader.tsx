import { Text } from "@/components/common_components/Text";
import { BackButton } from "@/components/common_components/BackButton";
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
        <BackButton onPress={onBack} topInset={0} />
        <Text mono style={s.headerTitle}>
          {t("registerFlow.headerTitle")}
        </Text>
        {step !== "intro" ? (
          <Pressable
            onPress={onCancelRegistration}
            hitSlop={12}
            style={s.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t("registerFlow.cancelRegistration")}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      <ProgressRow filled={filledSegments} total={3} />

      <View style={{ height: 12 }} />
    </>
  );
}
