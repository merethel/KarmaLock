import type { TranslationKey } from "@/src/i18n/types";
import * as LocalAuthentication from "expo-local-authentication";
import type { Href } from "expo-router";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";

const PREF_KEY = "karmalock_unlock_with_biometrics";

const TABS_HREF = "/(tabs)" as Href;

export async function getBiometricUnlockEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PREF_KEY)) === "1";
}

export async function setBiometricUnlockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(PREF_KEY, "1");
  } else {
    try {
      await SecureStore.deleteItemAsync(PREF_KEY);
    } catch {
      /* no stored value */
    }
  }
}

export async function biometricHardwareReady(): Promise<boolean> {
  try {
    if (!(await LocalAuthentication.hasHardwareAsync())) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export type BiometricPromptLabels = {
  promptMessage: string;
  fallbackLabel: string;
  cancelLabel: string;
};

export async function authenticateWithBiometric(
  labels: BiometricPromptLabels,
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: labels.promptMessage,
      fallbackLabel: labels.fallbackLabel,
      cancelLabel: labels.cancelLabel,
      disableDeviceFallback: false,
    });
    return result.success === true;
  } catch {
    return false;
  }
}

export async function shouldUseBiometricGate(): Promise<boolean> {
  if (!(await getBiometricUnlockEnabled())) return false;
  return biometricHardwareReady();
}

/** After email/password sign-in: offer to enable biometric unlock for next app opens. */
export function offerBiometricEnrollmentAfterAuth(
  router: { replace: (href: Href) => void },
  t: (key: TranslationKey) => string,
): void {
  void (async () => {
    if (await getBiometricUnlockEnabled()) {
      router.replace(TABS_HREF);
      return;
    }
    if (!(await biometricHardwareReady())) {
      router.replace(TABS_HREF);
      return;
    }

    Alert.alert(
      t("biometric.enrollTitle"),
      t("biometric.enrollBody"),
      [
        {
          text: t("biometric.notNow"),
          style: "cancel",
          onPress: () => router.replace(TABS_HREF),
        },
        {
          text: t("biometric.enable"),
          onPress: async () => {
            const ok = await authenticateWithBiometric({
              promptMessage: t("biometric.enrollPrompt"),
              fallbackLabel: t("biometric.fallbackPasscode"),
              cancelLabel: t("biometric.cancel"),
            });
            if (ok) await setBiometricUnlockEnabled(true);
            router.replace(TABS_HREF);
          },
        },
      ],
      { cancelable: true, onDismiss: () => router.replace(TABS_HREF) },
    );
  })();
}
