import { ConfirmModal } from "@/components/common_components/ConfirmModal";
import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useKeyboardBottomInset } from "@/hooks/useKeyboardBottomInset";
import { useScrollFieldAboveKeyboard } from "@/hooks/useScrollFieldAboveKeyboard";
import { scanChipUid } from "@/src/nfc/scanChipUid";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import type { ScrollView as RNScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { uploadImage } from "@/src/api/uploads";
import { createBelonging, listMyBelongings } from "@/src/api/belongings";
import { ApiError } from "@/src/api/client";

import { RegisterReviewStep } from "@/components/register/RegisterReviewStep";
import { useRegisterDraft } from "@/components/register/RegisterDraftContext";
import { RegisterWizardHeader } from "@/components/register/RegisterWizardHeader";
import { registerStyles as s } from "@/components/register/registerStyles";

export default function AddBelongingReviewScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardBottomInset();
  const theme = Colors[useColorScheme() ?? "dark"];

  const {
    photos,
    chipUid,
    setChipUid,
    title,
    brand,
    model,
    color,
    category,
    estimatedValue,
    serialNumber,
    purchaseDate,
    description,
    reset,
  } = useRegisterDraft();

  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");

  const [chipExistsOpen, setChipExistsOpen] = useState(false);
  const [chipExistsBelongingId, setChipExistsBelongingId] = useState<string>("");

  const scrollRef = useRef<RNScrollView | null>(null);
  const scrollYRef = useRef(0);

  const scrollFieldAboveKeyboard = useScrollFieldAboveKeyboard({
    scrollRef,
    getScrollY: () => scrollYRef.current,
    keyboardHeight: kb,
    gap: 14,
  });

  const filledSegments = useMemo(() => 3, []);

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

  const verifyChipNotInVault = useCallback(
    async (uid: string): Promise<boolean> => {
      const res = await listMyBelongings();
      const items = res.data.items ?? [];
      const found = items.find((it) => it.chipUid === uid.trim());
      if (found?._id) {
        setChipExistsBelongingId(found._id);
        setChipExistsOpen(true);
        return false;
      }
      return true;
    },
    [],
  );

  const onScanChip = useCallback(async () => {
    try {
      setError("");
      setBusy(true);
      setBusyMessage(t("registerFlow.scanningChip"));
      const uid = await scanChipUid({
        iosAlertMessage: t("scan.iosAlertMessage"),
        nfcUnavailable: t("scan.nfcUnavailable"),
        nfcNotSupported: t("scan.nfcNotSupported"),
        noChipIdFound: t("scan.noChipIdFound"),
      });
      setChipUid(uid);
      try {
        await verifyChipNotInVault(uid);
      } catch {
        // ignore lookup failures here
      }
    } catch (e: unknown) {
      Alert.alert(
        t("errors.failed"),
        e instanceof Error ? e.message : t("errors.failed"),
      );
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }, [setChipUid, t, verifyChipNotInVault]);

  const onSubmit = useCallback(async () => {
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

      try {
        const ok = await verifyChipNotInVault(chipUid);
        if (!ok) return;
      } catch {
        // allow submit; backend will validate uniqueness
      }

      setBusy(true);
      setBusyMessage(t("addBelonging.processing"));

      const firstPhotoUri = photos[0];
      let photoUrl: string | undefined = undefined;
      if (firstPhotoUri != null) {
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

      reset();
      router.replace("/(tabs)/vault");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        try {
          const ok = await verifyChipNotInVault(chipUid);
          if (!ok) return;
        } catch {
          // fall through
        }
      }

      setError(
        e instanceof Error ? e.message : t("errors.createBelongingFailed"),
      );
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }, [
    brand,
    category,
    chipUid,
    color,
    description,
    estimatedValue,
    model,
    photos,
    purchaseDate,
    reset,
    router,
    serialNumber,
    t,
    title,
    verifyChipNotInVault,
  ]);

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
      <ConfirmModal
        visible={chipExistsOpen}
        onClose={() => {
          setChipExistsOpen(false);
          setChipExistsBelongingId("");
          setChipUid("");
        }}
        onConfirm={() => {
          setChipExistsOpen(false);
          const id = chipExistsBelongingId;
          setChipExistsBelongingId("");
          if (!id) return;
          router.push({ pathname: "/belonging/[id]", params: { id } });
        }}
        title={t("registerFlow.chipExistsTitle")}
        body={t("registerFlow.chipExistsBody")}
        cancelLabel={t("registerFlow.chipExistsUseAnother")}
        confirmLabel={t("registerFlow.chipExistsGoToBelonging")}
      />

      <LoadingOverlay
        visible={busy}
        title={busyMessage || t("addBelonging.processing")}
        subtitle={
          busyMessage ? t("registerFlow.analyzingSubtitle") : t("addBelonging.analyzing")
        }
      />

      <View style={s.inner}>
        <RegisterWizardHeader
          t={t}
          step="review"
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
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
        >
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
            onScanChip={onScanChip}
            onSubmit={onSubmit}
            errorMessage={error}
            onFieldFocus={scrollFieldAboveKeyboard}
          />
        </ScrollView>
      </View>
    </View>
  );
}

