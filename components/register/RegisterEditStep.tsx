import { Button } from "@/components/common_components/Button";
import { LabeledTextField } from "@/components/common_components/LabeledTextField";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import { TextInput, View } from "react-native";

import { RegisterInlineErrorBanner } from "./RegisterInlineErrorBanner";
import { registerStyles as s } from "./registerStyles";

import type { TranslationKey } from "@/src/i18n/types";

type T = (key: TranslationKey) => string;

export function RegisterEditStep({
  t,
  errorMessage,
  title,
  setTitle,
  brand,
  setBrand,
  model,
  setModel,
  color,
  setColor,
  category,
  setCategory,
  serialNumber,
  setSerialNumber,
  estimatedValue,
  setEstimatedValue,
  purchaseDate,
  setPurchaseDate,
  description,
  setDescription,
  onContinue,
}: {
  t: T;
  errorMessage?: string;
  title: string;
  setTitle: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  serialNumber: string;
  setSerialNumber: (v: string) => void;
  estimatedValue: string;
  setEstimatedValue: (v: string) => void;
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <Text style={s.accentEyebrow}>{t("registerFlow.stepEditEyebrow")}</Text>
      <Text style={s.sectionTitle}>{t("registerFlow.stepEditTitle")}</Text>
      <Text dim style={s.sectionHint}>
        {t("registerFlow.stepEditHint")}
      </Text>

      <View style={s.formGap}>
        <LabeledTextField
          label={t("registerFlow.fieldAssetName")}
          value={title}
          onChangeText={setTitle}
          placeholder={t("registerFlow.phAssetName")}
        />
        <LabeledTextField
          label={t("registerFlow.fieldBrand")}
          value={brand}
          onChangeText={setBrand}
          placeholder={t("registerFlow.phBrand")}
        />
        <LabeledTextField
          label={t("registerFlow.fieldModel")}
          value={model}
          onChangeText={setModel}
          placeholder={t("registerFlow.phModel")}
        />
        <LabeledTextField
          label={t("registerFlow.fieldColor")}
          value={color}
          onChangeText={setColor}
          placeholder={t("registerFlow.phColor")}
        />
        <LabeledTextField
          label={t("registerFlow.fieldType")}
          value={category}
          onChangeText={setCategory}
          placeholder={t("registerFlow.phType")}
        />
        <LabeledTextField
          label={t("registerFlow.fieldValue")}
          value={estimatedValue}
          onChangeText={(v) => setEstimatedValue(v.replace(/[^\d]/g, ""))}
          placeholder="0"
          keyboardType="number-pad"
        />
        <LabeledTextField
          label={t("registerFlow.fieldSerial")}
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder={t("registerFlow.phSerial")}
        />
        <LabeledTextField
          label={t("registerFlow.fieldPurchaseDate")}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
        />
        <View style={{ gap: 10 }}>
          <Text mono style={s.notesLabel}>
            {t("registerFlow.fieldNotes")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("registerFlow.phNotes")}
            placeholderTextColor="rgba(255,255,255,0.38)"
            multiline
            selectionColor={palette.selection}
            style={s.notesInput}
          />
        </View>
      </View>

      {errorMessage ? (
        <View style={{ marginTop: 12 }}>
          <RegisterInlineErrorBanner
            title={t("registerFlow.stepErrorTitle")}
            message={errorMessage}
            compact
          />
        </View>
      ) : null}
      <Button title={t("registerFlow.continue")} onPress={onContinue} />
    </>
  );
}
