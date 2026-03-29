import { LanguageRow } from "@/components/LanguagePicker";
import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useFocusEffect } from "@react-navigation/native";
import {
  authenticateWithBiometric,
  biometricHardwareReady,
  getBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
} from "@/src/auth/biometrics";
import { useI18n } from "@/src/i18n/context";
import type { Locale } from "@/src/i18n/types";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { clearSession } from "../../src/auth/session";

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const av = await biometricHardwareReady();
        const on = await getBiometricUnlockEnabled();
        if (active) {
          setBioAvailable(av);
          setBioOn(on);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  async function toggleBiometrics() {
    if (!bioAvailable) return;
    if (bioOn) {
      await setBiometricUnlockEnabled(false);
      setBioOn(false);
      return;
    }
    const ok = await authenticateWithBiometric({
      promptMessage: t("biometric.enrollPrompt"),
      fallbackLabel: t("biometric.fallbackPasscode"),
      cancelLabel: t("biometric.cancel"),
    });
    if (ok) {
      await setBiometricUnlockEnabled(true);
      setBioOn(true);
    }
  }

  async function handleLogout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  function pickLanguage(next: Locale) {
    void setLocale(next);
  }

  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: "900" }}>
          {t("settings.title")}
        </Text>
      </View>

      <View style={{ marginTop: 28, gap: 12 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("settings.language")}
        </Text>
        <LanguageRow
          label={t("settings.languageEnglish")}
          selected={locale === "en"}
          onPress={() => pickLanguage("en")}
        />
        <LanguageRow
          label={t("settings.languageDanish")}
          selected={locale === "da"}
          onPress={() => pickLanguage("da")}
        />

        {bioAvailable ? (
          <View style={{ marginTop: 16, gap: 8 }}>
            <LanguageRow
              label={t("settings.biometrics")}
              selected={bioOn}
              onPress={() => void toggleBiometrics()}
            />
            <Text dim style={{ fontSize: 13, lineHeight: 18 }}>
              {t("settings.biometricsHint")}
            </Text>
          </View>
        ) : null}

        <View style={{ height: 8 }} />

        <Button
          title={t("settings.signOut")}
          variant="outline"
          onPress={handleLogout}
        />
      </View>

      <View style={{ marginTop: "auto", paddingBottom: 24 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("settings.security")}
        </Text>
        <Text dim style={{ marginTop: 8 }}>{t("settings.signOutHint")}</Text>
      </View>
    </Screen>
  );
}
