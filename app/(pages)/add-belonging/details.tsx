import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useKeyboardBottomInset } from "@/hooks/useKeyboardBottomInset";
import { useScrollFieldAboveKeyboard } from "@/hooks/useScrollFieldAboveKeyboard";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScrollView as RNScrollView } from "react-native";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BelongingDetailsForm } from "@/components/features/belonging/BelongingDetailsForm";
import { useRegisterDraft } from "@/components/features/register/RegisterDraftContext";
import { RegisterWizardHeader } from "@/components/features/register/RegisterWizardHeader";
import { registerStyles as s } from "@/components/features/register/registerStyles";

export default function AddBelongingDetailsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardBottomInset();
  const theme = Colors[useColorScheme() ?? "dark"];

  const {
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
  } = useRegisterDraft();

  const [busy] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<RNScrollView | null>(null);
  const scrollYRef = useRef(0);

  const scrollFieldAboveKeyboard = useScrollFieldAboveKeyboard({
    scrollRef,
    getScrollY: () => scrollYRef.current,
    keyboardHeight: kb,
    gap: 14,
  });

  const filledSegments = useMemo(() => 2, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, []);

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

  function continueToReview() {
    setError("");
    if (!title.trim()) {
      setError(t("registerFlow.errorTitle"));
      return;
    }
    router.push("/add-belonging/review");
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
        title={t("addBelonging.processing")}
        subtitle={t("addBelonging.analyzing")}
      />

      <View style={s.inner}>
        <RegisterWizardHeader
          t={t}
          step="edit"
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
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
        >
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
            onSubmit={continueToReview}
            submitLabel={t("registerFlow.continue")}
            showHeader
            onFieldFocus={scrollFieldAboveKeyboard}
          />
        </ScrollView>
      </View>
    </View>
  );
}
