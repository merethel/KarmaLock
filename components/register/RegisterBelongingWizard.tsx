import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  describeBelongingFromPhotos,
  pickPhotoFromLibrary,
  takePhoto,
} from "@/src/api/ai";
import { createBelonging } from "@/src/api/belongings";
import { uploadImage } from "@/src/api/uploads";
import { useI18n } from "@/src/i18n/context";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";
import { useKeyboardBottomInset } from "@/hooks/useKeyboardBottomInset";
import { useScrollFieldToTop } from "@/hooks/useScrollFieldToTop";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BelongingDetailsForm } from "@/components/belonging/BelongingDetailsForm";
import { RegisterInlineErrorBanner } from "./RegisterInlineErrorBanner";
import { RegisterIntroStep } from "./RegisterIntroStep";
import { RegisterPhotosStep } from "./RegisterPhotosStep";
import { RegisterReviewStep } from "./RegisterReviewStep";
import { RegisterWizardHeader } from "./RegisterWizardHeader";
import { registerStyles as s } from "./registerStyles";
import {
  applySuggestionToFields,
  PHOTO_COUNT,
  type WizardStep,
} from "./registerTypes";

export function RegisterBelongingWizard({
  initialChipUid,
}: {
  initialChipUid: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];

  const [step, setStep] = useState<WizardStep>("intro");
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [keepQuality, setKeepQuality] = useState(false);
  const [chipUid, setChipUid] = useState(initialChipUid);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const kb = useKeyboardBottomInset();
  const scrollYRef = useRef(0);
  const scrollFieldToTop = useScrollFieldToTop({
    scrollRef,
    getScrollY: () => scrollYRef.current,
    getTopY: () => insets.top + 90,
  });

  const quality = keepQuality ? 1 : 0.72;

  const filledSegments = useMemo(() => {
    const m: Record<WizardStep, number> = {
      intro: 0,
      photos: 1,
      edit: 2,
      review: 3,
    };
    return m[step];
  }, [step]);

  const allPhotosDone = photos.every(Boolean);

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

  const goBack = useCallback(() => {
    if (step === "intro") router.back();
    else if (step === "photos") setStep("intro");
    else if (step === "edit") setStep("photos");
    else setStep("edit");
  }, [router, step]);

  const swipeBackResponder = useEdgeSwipeBack({
    onBack: goBack,
    disabled: busy,
  });

  const confirmCancel = () => {
    Alert.alert(t("registerFlow.cancelTitle"), t("registerFlow.cancelBody"), [
      { text: t("addBelonging.cancel"), style: "cancel" },
      {
        text: t("registerFlow.cancelConfirm"),
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

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
      setStep("edit");
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
    setStep("edit");
  }

  async function submit() {
    try {
      setError("");
      if (!title.trim()) {
        setError(t("registerFlow.errorTitle"));
        return;
      }
      if (!chipUid.trim()) {
        setError(t("registerFlow.errorChip"));
        return;
      }
      setBusy(true);
      setBusyMessage(t("addBelonging.processing"));

      const firstPhotoUri = photos[0];
      let photoUrl: string | undefined = undefined;
      if (firstPhotoUri != null) {
        // Backend no longer accepts base64. Upload first, then store the HTTPS URL.
        photoUrl = await uploadImage(firstPhotoUri);
      }

      await createBelonging({
        chipUid: chipUid.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        photoUrl,
        category: category.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        color: color.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        attributes: {
          estimatedValueDkk: estimatedValue.trim() || undefined,
          purchaseDate: purchaseDate.trim() || undefined,
          registrationViews: ["front", "side", "detail"],
        },
      });
      router.back();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : t("errors.createBelongingFailed"),
      );
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  function mockScanChip() {
    setChipUid(`KL-${Math.floor(Math.random() * 9000 + 1000)}-X`);
  }

  function continueFromEdit() {
    setError("");
    if (!title.trim()) {
      setError(t("registerFlow.errorTitle"));
      return;
    }
    setStep("review");
  }

  useEffect(() => {
    // Changing step should clear any prior error state.
    setError("");
  }, [step]);

  useEffect(() => {
    if (!error || step !== "photos") return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [error, step]);

  return (
    <View
      {...swipeBackResponder.panHandlers}
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
          step={step}
          filledSegments={filledSegments}
          onBack={goBack}
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
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
        >
          {error && step !== "photos" && step !== "edit" ? (
            <RegisterInlineErrorBanner
              title={t("registerFlow.stepErrorTitle")}
              message={error}
              compact
            />
          ) : null}

          {step === "intro" ? (
            <RegisterIntroStep t={t} onStart={() => setStep("photos")} />
          ) : null}

          {step === "photos" ? (
            <RegisterPhotosStep
              t={t}
              photos={photos}
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
              captureLabels={captureLabels}
              retakeLabels={retakeLabels}
              slotTitles={slotTitles}
              slotHints={slotHints}
              captureSlot={captureSlot}
              keepQuality={keepQuality}
              setKeepQuality={setKeepQuality}
              allPhotosDone={allPhotosDone}
              onAnalyze={runAi}
              onSkipAi={skipAi}
              actionError={error}
            />
          ) : null}

          {step === "edit" ? (
            <BelongingDetailsForm
              t={t}
              errorMessage={error}
              title={title}
              setTitle={setTitle}
              brand={brand}
              setBrand={setBrand}
              model={model}
              setModel={setModel}
              color={color}
              setColor={setColor}
              category={category}
              setCategory={setCategory}
              serialNumber={serialNumber}
              setSerialNumber={setSerialNumber}
              estimatedValue={estimatedValue}
              setEstimatedValue={setEstimatedValue}
              purchaseDate={purchaseDate}
              setPurchaseDate={setPurchaseDate}
              description={description}
              setDescription={setDescription}
              onSubmit={continueFromEdit}
              submitLabel={t("registerFlow.continue")}
              showHeader
              onFieldFocus={(e) => {
                scrollFieldToTop(e);
              }}
            />
          ) : null}

          {step === "review" ? (
            <RegisterReviewStep
              t={t}
              title={title}
              brand={brand}
              model={model}
              color={color}
              category={category}
              estimatedValue={estimatedValue}
              serialNumber={serialNumber}
              chipUid={chipUid}
              setChipUid={setChipUid}
              onMockScanChip={mockScanChip}
              onSubmit={submit}
              errorMessage={error}
              onFieldFocus={(e) => {
                scrollFieldToTop(e);
              }}
            />
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}
