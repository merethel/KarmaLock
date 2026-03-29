import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import { palette } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Image,
  Pressable,
  Switch,
  View,
} from "react-native";

import { RegisterInlineErrorBanner } from "./RegisterInlineErrorBanner";
import { registerStyles as s } from "./registerStyles";

import type { TranslationKey } from "@/src/i18n/types";

type T = (key: TranslationKey) => string;

function analyzeErrorBody(raw: string | undefined, t: T): string {
  if (!raw?.trim()) return "";
  const u = raw.toLowerCase();
  if (
    u.includes("internal server") ||
    u.includes("bad gateway") ||
    u.includes("service unavailable") ||
    u.includes("gateway timeout") ||
    u.includes("error 500") ||
    u.includes("status code 500") ||
    u.includes("status 502") ||
    u.includes("status 503") ||
    u.includes("status 504")
  ) {
    return t("registerFlow.analyzeFailedGeneric");
  }
  return raw.trim();
}

export function RegisterPhotosStep({
  t,
  photos,
  activeSlot,
  setActiveSlot,
  captureLabels,
  retakeLabels,
  slotTitles,
  slotHints,
  captureSlot,
  keepQuality,
  setKeepQuality,
  allPhotosDone,
  onAnalyze,
  onSkipAi,
  actionError,
}: {
  t: T;
  photos: (string | null)[];
  activeSlot: number;
  setActiveSlot: (i: number) => void;
  captureLabels: string[];
  retakeLabels: string[];
  slotTitles: string[];
  slotHints: string[];
  captureSlot: (index: number, fromLibrary: boolean) => void;
  keepQuality: boolean;
  setKeepQuality: (v: boolean) => void;
  allPhotosDone: boolean;
  onAnalyze: () => void;
  onSkipAi: () => void;
  actionError?: string;
}) {
  const analyzeErrorMessage = useMemo(
    () => analyzeErrorBody(actionError, t),
    [actionError, t],
  );

  return (
    <>
      <Text style={s.accentEyebrow}>{t("registerFlow.stepPhotosEyebrow")}</Text>
      <Text style={s.sectionTitle}>{t("registerFlow.stepPhotosTitle")}</Text>
      <Text dim style={s.sectionHint}>
        {t("registerFlow.stepPhotosHint")}
      </Text>

      <Text style={s.slotTitle}>{slotTitles[activeSlot]}</Text>
      <Text dim style={s.slotHint}>
        {slotHints[activeSlot]}
      </Text>

      <View style={s.preview}>
        {photos[activeSlot] ? (
          <>
            <Image
              source={{ uri: photos[activeSlot]! }}
              style={s.previewImage}
            />
            <View style={s.checkBadge}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
          </>
        ) : (
          <View style={s.previewPlaceholder}>
            <Ionicons
              name="camera-outline"
              size={40}
              color="rgba(255,255,255,0.2)"
            />
            <Text muted mono style={s.previewLabel}>
              {slotTitles[activeSlot].toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [s.captureBtn, pressed && { opacity: 0.92 }]}
        onPress={() => void captureSlot(activeSlot, false)}
      >
        <Ionicons name="camera" size={22} color="#fff" />
        <Text style={s.captureBtnText}>
          {photos[activeSlot]
            ? retakeLabels[activeSlot]
            : captureLabels[activeSlot]}
        </Text>
      </Pressable>

      <Button
        title={t("registerFlow.fromLibrary")}
        variant="outline"
        onPress={() => void captureSlot(activeSlot, true)}
      />

      <View style={s.thumbRow}>
        {photos.map((uri, i) => (
          <Pressable
            key={i}
            onPress={() => setActiveSlot(i)}
            style={[s.thumb, activeSlot === i && s.thumbActive]}
          >
            {uri ? (
              <Image source={{ uri }} style={s.thumbImage} />
            ) : (
              <Text muted style={s.thumbEmpty}>
                {i + 1}
              </Text>
            )}
            {uri ? (
              <View style={s.thumbCheck}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <View style={s.qualityRow}>
        <Text style={s.qualityLabel}>{t("registerFlow.keepQuality")}</Text>
        <Switch
          value={keepQuality}
          onValueChange={setKeepQuality}
          trackColor={{
            false: "#333",
            true: palette.accentTrack,
          }}
          thumbColor={keepQuality ? palette.accent : "#888"}
        />
      </View>

      <RegisterInlineErrorBanner
        title={t("registerFlow.analyzeFailedTitle")}
        message={analyzeErrorMessage}
      />

      <Pressable
        style={({ pressed }) => [
          s.analyzeBtn,
          !allPhotosDone && s.analyzeBtnDisabled,
          pressed && allPhotosDone && { opacity: 0.92 },
        ]}
        onPress={() => void onAnalyze()}
        disabled={!allPhotosDone}
      >
        <Ionicons name="sparkles-outline" size={22} color="#fff" />
        <Text style={s.captureBtnText}>{t("registerFlow.analyzeAi")}</Text>
      </Pressable>

      <Button
        title={t("registerFlow.skipAi")}
        variant="ghost"
        onPress={onSkipAi}
      />
    </>
  );
}
