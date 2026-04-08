import { Button } from "@/components/common_components/Button";
import { LabeledTextField } from "@/components/common_components/LabeledTextField";
import { Text } from "@/components/common_components/Text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { RegisterInlineErrorBanner } from "./RegisterInlineErrorBanner";
import { RegisterSummaryRow } from "./RegisterSummaryRow";
import { PHOTO_COUNT } from "./registerTypes";
import { registerStyles as s } from "./registerStyles";

import type { TranslationKey } from "@/src/i18n/types";
import type { TextInputProps } from "react-native";

type T = (key: TranslationKey) => string;

export function RegisterReviewStep({
  t,
  title,
  brand,
  model,
  color,
  category,
  estimatedValue,
  serialNumber,
  chipUid,
  setChipUid,
  onMockScanChip,
  onSubmit,
  errorMessage,
  onFieldFocus,
}: {
  t: T;
  title: string;
  brand: string;
  model: string;
  color: string;
  category: string;
  estimatedValue: string;
  serialNumber: string;
  chipUid: string;
  setChipUid: (v: string) => void;
  onMockScanChip: () => void;
  onSubmit: () => void;
  errorMessage?: string;
  onFieldFocus?: TextInputProps["onFocus"];
}) {
  const canSubmit = Boolean(title.trim() && chipUid.trim());

  return (
    <>
      <Text style={s.accentEyebrow}>
        {t("registerFlow.stepReviewEyebrow")}
      </Text>
      <Text style={s.sectionTitle}>{t("registerFlow.stepReviewTitle")}</Text>
      <Text dim style={s.sectionHint}>
        {t("registerFlow.stepReviewHint")}
      </Text>

      <View style={s.summaryCard}>
        <RegisterSummaryRow
          label={t("registerFlow.sumName")}
          value={title || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumBrand")}
          value={brand || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumModel")}
          value={model || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumColor")}
          value={color || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumType")}
          value={category || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumValue")}
          value={estimatedValue || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumSerial")}
          value={serialNumber || "—"}
        />
        <RegisterSummaryRow
          label={t("registerFlow.sumPhotos")}
          value={t("registerFlow.photosAttached").replace(
            "{{count}}",
            String(PHOTO_COUNT),
          )}
        />
      </View>

      <LabeledTextField
        label={t("registerFlow.chipUid")}
        value={chipUid}
        onChangeText={setChipUid}
        placeholder={t("addBelonging.chipPlaceholder")}
        onFocus={onFieldFocus}
      />
      <Button
        title={t("registerFlow.scanChipMock")}
        variant="outline"
        onPress={onMockScanChip}
      />

      {!chipUid.trim() ? (
        <Text dim style={s.patchHint}>
          {t("registerFlow.noPatchHint")}
        </Text>
      ) : null}

      {errorMessage ? (
        <View style={{ marginTop: 12 }}>
          <RegisterInlineErrorBanner
            title={t("registerFlow.stepErrorTitle")}
            message={errorMessage}
            compact
          />
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          s.confirmBtn,
          !canSubmit && s.confirmBtnDisabled,
          pressed && canSubmit && { opacity: 0.92 },
        ]}
        onPress={() => void onSubmit()}
        disabled={!canSubmit}
      >
        <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
        <Text style={s.captureBtnText}>
          {t("registerFlow.confirmRegister")}
        </Text>
      </Pressable>
    </>
  );
}
