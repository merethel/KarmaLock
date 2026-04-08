import { BelongingDetailsForm } from "@/components/belonging/BelongingDetailsForm";
import { BackButton } from "@/components/common_components/BackButton";
import { Text } from "@/components/common_components/Text";
import type { Belonging } from "@/src/api/belongings";
import { listMyBelongings, updateBelonging } from "@/src/api/belongings";
import { useI18n } from "@/src/i18n/context";
import { useKeyboardBottomInset } from "@/hooks/useKeyboardBottomInset";
import { useScrollFieldToTop } from "@/hooks/useScrollFieldToTop";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function asString(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

export default function EditBelongingDetailsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kb = useKeyboardBottomInset();
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const scrollFieldToTop = useScrollFieldToTop({
    scrollRef,
    getScrollY: () => scrollYRef.current,
    getTopY: () => insets.top + 90,
  });

  const [item, setItem] = useState<Belonging | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      setLoading(true);
      const res = await listMyBelongings();
      const found = (res.data.items || []).find((x) => x._id === id) ?? null;
      setItem(found);
      if (!found) setErrorMessage(t("errors.failed"));
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : t("errors.failed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setBrand(item.brand ?? "");
    setModel(item.model ?? "");
    setColor(item.color ?? "");
    setCategory(item.category ?? "");
    setSerialNumber(item.serialNumber ?? "");
    setDescription(item.description ?? "");
    setEstimatedValue(asString(item.attributes?.estimatedValueDkk ?? ""));
    setPurchaseDate(asString(item.attributes?.purchaseDate ?? ""));
  }, [item]);

  const submitLabel = useMemo(() => t("vault.save"), [t]);

  const onSubmit = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setErrorMessage("");
    try {
      await updateBelonging(String(id), {
        title: title.trim(),
        description,
        brand,
        model,
        color,
        category,
        serialNumber,
        attributes: {
          ...(item?.attributes ?? {}),
          estimatedValueDkk: estimatedValue,
          purchaseDate,
        },
      });
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("errors.failed");
      setErrorMessage(msg);
      Alert.alert(t("errors.failed"), msg);
    } finally {
      setBusy(false);
    }
  }, [
    brand,
    category,
    color,
    description,
    estimatedValue,
    id,
    item?.attributes,
    model,
    purchaseDate,
    router,
    serialNumber,
    t,
    title,
  ]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom },
      ]}
    >
      <BackButton
        onPress={() => router.back()}
        topInset={0}
        style={{ position: "absolute", left: 20, top: 60, zIndex: 10 }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + Math.max(0, kb - insets.bottom) },
        ]}
        keyboardShouldPersistTaps="handled"
        bounces
        alwaysBounceVertical
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          // Pull down past the top to dismiss (full-screen modal feel).
          if (y < -80) router.back();
        }}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
            <Text dim style={{ marginTop: 12 }}>
              {t("vault.loading")}
            </Text>
          </View>
        ) : !item ? (
          <View style={styles.center}>
            <Text style={styles.error}>
              {errorMessage || t("errors.failed")}
            </Text>
          </View>
        ) : (
          <BelongingDetailsForm
            t={t}
            errorMessage={errorMessage}
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
            onSubmit={busy ? () => {} : onSubmit}
            submitLabel={busy ? t("vault.saving") : submitLabel}
            showHeader={false}
            onFieldFocus={scrollFieldToTop}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  content: { paddingBottom: 120, gap: 14, paddingTop: 56 },
  center: {
    paddingTop: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: "tomato", textAlign: "center" },
});
