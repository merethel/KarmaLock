import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import {
  authenticateWithBiometric,
  setBiometricUnlockEnabled,
} from "@/src/auth/biometrics";
import { clearSession } from "@/src/auth/session";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UnlockScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(true);
  const [showActions, setShowActions] = useState(false);

  async function doUnlock() {
    setBusy(true);
    setShowActions(false);
    const ok = await authenticateWithBiometric({
      promptMessage: t("biometric.unlockPrompt"),
      fallbackLabel: t("biometric.fallbackPasscode"),
      cancelLabel: t("biometric.cancel"),
    });
    setBusy(false);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      setShowActions(true);
    }
  }

  useEffect(() => {
    void doUnlock();
    // Intentionally once on mount; retry uses current t/router via button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithPassword() {
    await setBiometricUnlockEnabled(false);
    await clearSession();
    router.replace("/(auth)/login");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        paddingTop: insets.top + 40,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 24,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
        KARMALOCK
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "900", textAlign: "center" }}>
        {t("biometric.unlockTitle")}
      </Text>

      {busy ? (
        <ActivityIndicator size="large" color="#FF2DAA" />
      ) : (
        <Text dim style={{ textAlign: "center", lineHeight: 22 }}>
          {t("biometric.unlockHint")}
        </Text>
      )}

      {showActions && !busy ? (
        <View style={{ width: "100%", gap: 12, marginTop: 8 }}>
          <Button title={t("biometric.retry")} onPress={() => void doUnlock()} />
          <Button
            title={t("biometric.usePassword")}
            variant="ghost"
            onPress={() => void signInWithPassword()}
          />
        </View>
      ) : null}
    </View>
  );
}
