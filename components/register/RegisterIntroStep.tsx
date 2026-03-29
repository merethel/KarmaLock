import { Text } from "@/components/common_components/Text";
import { View } from "react-native";

import { RegisterPrimaryCta } from "@/components/common_components/RegisterPrimaryCta";
import { registerStyles as s } from "./registerStyles";

import type { TranslationKey } from "@/src/i18n/types";

type T = (key: TranslationKey) => string;

export function RegisterIntroStep({
  t,
  onStart,
}: {
  t: T;
  onStart: () => void;
}) {
  return (
    <>
      <Text muted mono style={s.eyebrow}>
        {t("registerFlow.introEyebrow")}
      </Text>
      <Text style={s.introTitle}>{t("registerFlow.introTitle")}</Text>
      <Text dim style={s.introBody}>
        {t("registerFlow.introBody")}
      </Text>
      <View style={s.stepsCard}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={s.stepRow}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={s.stepLabel}>
              {i === 0
                ? t("registerFlow.stepFront")
                : i === 1
                  ? t("registerFlow.stepSide")
                  : t("registerFlow.stepDetail")}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 8, width: "100%" }}>
        <RegisterPrimaryCta
          label={t("registerFlow.startRegistration")}
          onPress={onStart}
          icon="arrow-forward"
        />
      </View>
    </>
  );
}
