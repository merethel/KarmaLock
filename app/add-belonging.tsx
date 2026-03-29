import { Button } from "@/components/common_components/Button";
import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";

import {
  describeBelongingPhoto,
  takePhoto,
  type AiSuggestion,
} from "../src/api/ai";
import { createBelonging } from "../src/api/belongings";
import { useI18n } from "../src/i18n/context";

export default function AddBelongingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ chipUid?: string }>();

  const initialChip = useMemo(
    () => (params.chipUid ? String(params.chipUid) : ""),
    [params.chipUid],
  );

  const [chipUid, setChipUid] = useState(initialChip);
  const [photoUri, setPhotoUri] = useState<string>("");
  const [ai, setAi] = useState<AiSuggestion | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function mockScanChip() {
    // swap later with real NFC scan
    const uid = `KL-${Math.floor(Math.random() * 9000 + 1000)}-X`;
    setChipUid(uid);
  }

  async function onTakePhotoAndAutofill() {
    try {
      setError("");
      setBusy(true);

      if (!chipUid) throw new Error(t("errors.scanChipFirst"));

      const uri = await takePhoto();
      setPhotoUri(uri);

      const suggestion = await describeBelongingPhoto(uri);
      setAi(suggestion);

      // Prefill form fields
      setTitle(suggestion.title || "");
      setDescription(suggestion.description || "");
    } catch (e: any) {
      setError(e?.message || t("errors.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onCreate() {
    try {
      setError("");
      setBusy(true);

      if (!chipUid) throw new Error(t("errors.missingChip"));
      if (!title.trim()) throw new Error(t("errors.titleRequired"));

      await createBelonging({
        chipUid,
        title: title.trim(),
        description: description.trim(),
        // If your backend supports it later:
        category: ai?.category,
        brand: ai?.brand,
        model: ai?.model,
        color: ai?.color,
        serialNumber: ai?.serialNumber,
        attributes: ai?.attributes,
      });

      router.back(); // go back to vault/cmd
    } catch (e: any) {
      setError(e?.message || t("errors.createBelongingFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      <LoadingOverlay
        visible={busy}
        title={t("addBelonging.processing")}
        subtitle={t("addBelonging.analyzing")}
      />

      <View style={{ gap: 6 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("addBelonging.newAsset")}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "900" }}>
          {t("addBelonging.title")}
        </Text>
      </View>

      {error ? (
        <Text style={{ color: "tomato", marginTop: 14 }}>{error}</Text>
      ) : null}

      <View style={{ marginTop: 20, gap: 14 }}>
        {/* Chip */}
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            {t("addBelonging.chipUid")}
          </Text>
          <TextInput
            value={chipUid}
            onChangeText={setChipUid}
            placeholder={t("addBelonging.chipPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={{
              height: 54,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              paddingHorizontal: 14,
              color: "white",
              fontSize: 16,
            }}
          />
          <Button
            title={t("addBelonging.scanChipMock")}
            variant="outline"
            onPress={mockScanChip}
          />
        </View>

        {/* Photo + AI */}
        <Button
          title={
            photoUri
              ? t("addBelonging.retakePhotoAutofill")
              : t("addBelonging.takePhotoAutofill")
          }
          onPress={onTakePhotoAndAutofill}
          disabled={!chipUid}
        />

        {ai?.confidence !== undefined ? (
          <Text muted mono style={{ letterSpacing: 1.6 }}>
            {t("addBelonging.aiConfidence")}:{" "}
            {Math.round((ai.confidence || 0) * 100)}%
          </Text>
        ) : null}

        {/* Form */}
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            {t("addBelonging.titleField")}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("addBelonging.titlePlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={{
              height: 54,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              paddingHorizontal: 14,
              color: "white",
              fontSize: 16,
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            {t("addBelonging.description")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("addBelonging.descriptionPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            style={{
              minHeight: 90,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              paddingHorizontal: 14,
              paddingTop: 12,
              color: "white",
              fontSize: 16,
            }}
          />
        </View>

        <Button
          title={t("addBelonging.addToVault")}
          onPress={onCreate}
          disabled={!chipUid || !title.trim()}
        />

        <Button
          title={t("addBelonging.cancel")}
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
