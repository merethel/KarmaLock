import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useKeyboardBottomInset } from "@/hooks/useKeyboardBottomInset";
import {
  describeBelongingFromPhotos,
  pickPhotoFromLibrary,
  takePhoto,
} from "@/src/api/ai";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRegisterDraft } from "@/components/register/RegisterDraftContext";
import { RegisterPhotosStep } from "@/components/register/RegisterPhotosStep";
import { RegisterWizardHeader } from "@/components/register/RegisterWizardHeader";
import { registerStyles as s } from "@/components/register/registerStyles";
import {
  applySuggestionToFields,
  PHOTO_COUNT,
} from "@/components/register/registerTypes";

export default function AddBelongingPhotosScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardBottomInset();
  const theme = Colors[useColorScheme() ?? "dark"];

  const {
    photos,
    setPhotos,
    setTitle,
    setBrand,
    setModel,
    setColor,
    setCategory,
    setSerialNumber,
    setEstimatedValue,
    setDescription,
  } = useRegisterDraft();

  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSlot, setActiveSlot] = useState(0);
  const quality = 1;

  const scrollRef = useRef<ScrollView | null>(null);

  const allPhotosDone = useMemo(
    () => photos.every((p) => typeof p === "string" && p.length > 0),
    [photos],
  );

  const captureLabels = useMemo(
    () => [
      t("registerFlow.captureFront"),
      t("registerFlow.captureSide"),
      t("registerFlow.captureDetail"),
    ],
    [t],
  );

  const retakeLabels = useMemo(
    () => [
      t("registerFlow.retakeFront"),
      t("registerFlow.retakeSide"),
      t("registerFlow.retakeDetail"),
    ],
    [t],
  );

  const slotTitles = useMemo(
    () => [
      t("registerFlow.slotFrontTitle"),
      t("registerFlow.slotSideTitle"),
      t("registerFlow.slotDetailTitle"),
    ],
    [t],
  );

  const slotHints = useMemo(
    () => [
      t("registerFlow.slotFrontHint"),
      t("registerFlow.slotSideHint"),
      t("registerFlow.slotDetailHint"),
    ],
    [t],
  );

  const filledSegments = 1;

  function confirmCancel() {
    Alert.alert(t("registerFlow.cancelTitle"), t("registerFlow.cancelBody"), [
      { text: t("addBelonging.cancel"), style: "cancel" },
      {
        text: t("registerFlow.cancelConfirm"),
        style: "destructive",
        onPress: () => router.replace("/(tabs)"),
      },
    ]);
  }

  async function captureSlot(index: number, fromLibrary: boolean) {
    try {
      setError("");
      const uri = fromLibrary
        ? await pickPhotoFromLibrary(quality)
        : await takePhoto(quality);
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = uri;
        return next;
      });
      setActiveSlot(index);
      if (index < PHOTO_COUNT - 1) setActiveSlot(index + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "Photo canceled") setError(msg);
    }
  }

  async function runAi() {
    if (!allPhotosDone) {
      setError(t("registerFlow.errorNeedThreePhotos"));
      return;
    }
    try {
      setError("");
      setBusy(true);
      setBusyMessage(t("registerFlow.analyzing"));
      const suggestion = await describeBelongingFromPhotos(
        photos as [string, string, string],
      );
      const f = applySuggestionToFields(suggestion);
      setTitle(f.title);
      setBrand(f.brand);
      setModel(f.model);
      setColor(f.color);
      setCategory(f.category);
      setSerialNumber(f.serialNumber);
      setEstimatedValue(f.estimatedValue);
      setDescription(f.description);
      router.push("/add-belonging/details");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  function skipAi() {
    if (!allPhotosDone) {
      setError(t("registerFlow.errorNeedThreePhotos"));
      return;
    }
    setError("");
    router.push("/add-belonging/details");
  }

  return (
    <View
      style={[
        s.root,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <LoadingOverlay
        visible={busy}
        title={busyMessage || t("addBelonging.processing")}
        subtitle={
          busyMessage
            ? t("registerFlow.analyzingSubtitle")
            : t("addBelonging.analyzing")
        }
      />

      <View style={s.inner}>
        <RegisterWizardHeader
          t={t}
          step="photos"
          filledSegments={filledSegments}
          onBack={() => router.back()}
          onCancelRegistration={confirmCancel}
        />

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: 120 + Math.max(0, kb - insets.bottom) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <RegisterPhotosStep
            t={t}
            photos={photos}
            activeSlot={activeSlot}
            setActiveSlot={setActiveSlot}
            captureLabels={captureLabels}
            retakeLabels={retakeLabels}
            slotTitles={slotTitles}
            slotHints={slotHints}
            captureSlot={(i, fromLib) => void captureSlot(i, fromLib)}
            allPhotosDone={allPhotosDone}
            onAnalyze={() => void runAi()}
            onSkipAi={skipAi}
            actionError={error}
          />
        </ScrollView>
      </View>
    </View>
  );
}
