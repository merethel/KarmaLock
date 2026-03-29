import { Button } from "@/components/common_components/Button";
import { LabeledTextField } from "@/components/common_components/LabeledTextField";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { palette } from "@/constants/Colors";
import { register } from "../../src/api/auth";
import { ApiError, isApiUrlLocalhostOnDevice } from "../../src/api/client";
import { offerBiometricEnrollmentAfterAuth } from "../../src/auth/biometrics";
import { setSession } from "../../src/auth/session";
import { useI18n } from "../../src/i18n/context";

export default function RegisterScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onRegister() {
    try {
      setBusy(true);
      setError("");

      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      const { token, user } = res.data;
      await setSession(token, user);

      offerBiometricEnrollmentAfterAuth(router, t);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(e.message.trim() ? e.message : t("errors.registrationFailed"));
      } else if (e instanceof Error) {
        const m = e.message;
        if (
          /network|Network request failed|Failed to fetch|Internet/i.test(m)
        ) {
          setError(
            isApiUrlLocalhostOnDevice()
              ? t("errors.networkLocalhostOnDevice")
              : t("errors.network"),
          );
        } else {
          setError(m || t("errors.registrationFailed"));
        }
      } else {
        setError(t("errors.registrationFailed"));
      }
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    name.trim().length > 1 && email.trim().length > 3 && password.length >= 6;

  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 8, marginTop: 10 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("register.newIdentity")}
        </Text>

        <Text style={{ fontSize: 28, fontWeight: "900", letterSpacing: 0.5 }}>
          {t("register.titleCreate")}
          <Text style={{ color: palette.accent }}>{t("register.titleAccount")}</Text>
        </Text>

        <Text dim style={{ marginTop: 6 }}>{t("register.subtitle")}</Text>
      </View>

      {/* Form */}
      <View style={{ marginTop: 28, gap: 16 }}>
        <LabeledTextField
          label={t("register.name")}
          value={name}
          onChangeText={setName}
          textContentType="name"
          autoComplete="name"
          autoCorrect={false}
          placeholder={t("register.placeholderName")}
        />

        <LabeledTextField
          label={t("register.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder={t("register.placeholderEmail")}
        />

        <LabeledTextField
          label={t("register.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          autoCorrect={false}
          passwordRules=""
          placeholder={t("register.placeholderPasswordHint")}
        />

        {error ? (
          <Text style={{ color: "tomato", marginTop: 6 }}>{error}</Text>
        ) : null}

        <View style={{ marginTop: 8, gap: 10 }}>
          <Button
            title={busy ? t("register.creating") : t("register.submit")}
            onPress={onRegister}
            disabled={busy || !canSubmit}
          />

          <Button
            title={t("register.backToLogin")}
            variant="ghost"
            onPress={() => router.replace("/(auth)/login")}
            disabled={busy}
          />
        </View>
      </View>

      {/* Footer hint */}
      <View style={{ marginTop: "auto", paddingBottom: 24 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("register.note")}
        </Text>
        <Text dim style={{ marginTop: 8 }}>{t("register.noteBody")}</Text>
      </View>
    </Screen>
  );
}
