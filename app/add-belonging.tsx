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

export default function AddBelongingScreen() {
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

      if (!chipUid) throw new Error("Scan a chip first");

      const uri = await takePhoto();
      setPhotoUri(uri);

      const suggestion = await describeBelongingPhoto(uri);
      setAi(suggestion);

      // Prefill form fields
      setTitle(suggestion.title || "");
      setDescription(suggestion.description || "");
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onCreate() {
    try {
      setError("");
      setBusy(true);

      if (!chipUid) throw new Error("Missing chipUid");
      if (!title.trim()) throw new Error("Title is required");

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
      setError(e?.message || "Failed to create belonging");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={{ paddingTop: 24, paddingHorizontal: 20 }}>
      <LoadingOverlay
        visible={busy}
        title="PROCESSING..."
        subtitle="ANALYZING IMAGE"
      />

      <View style={{ gap: 6 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          NEW ASSET
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "900" }}>ADD BELONGING</Text>
      </View>

      {error ? (
        <Text style={{ color: "tomato", marginTop: 14 }}>{error}</Text>
      ) : null}

      <View style={{ marginTop: 20, gap: 14 }}>
        {/* Chip */}
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            CHIP UID
          </Text>
          <TextInput
            value={chipUid}
            onChangeText={setChipUid}
            placeholder="Scan chip to fill..."
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
            title="SCAN CHIP (MOCK)"
            variant="outline"
            onPress={mockScanChip}
          />
        </View>

        {/* Photo + AI */}
        <Button
          title={photoUri ? "RETAKE PHOTO + AUTOFILL" : "TAKE PHOTO + AUTOFILL"}
          onPress={onTakePhotoAndAutofill}
          disabled={!chipUid}
        />

        {ai?.confidence !== undefined ? (
          <Text muted mono style={{ letterSpacing: 1.6 }}>
            AI CONFIDENCE: {Math.round((ai.confidence || 0) * 100)}%
          </Text>
        ) : null}

        {/* Form */}
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            TITLE
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Trek FX 2 Disc"
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
            DESCRIPTION
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes…"
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
          title="ADD TO VAULT"
          onPress={onCreate}
          disabled={!chipUid || !title.trim()}
        />

        <Button title="CANCEL" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
