import { LanguageFlagSwitcher } from "@/components/LanguagePicker";
import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { InteractionManager, Keyboard, TextInput, View } from "react-native";

import { login } from "@/src/api/auth";
import { ApiError, isApiUrlLocalhostOnDevice } from "@/src/api/client";
import { offerBiometricEnrollmentAfterAuth } from "@/src/auth/biometrics";
import { setSession } from "@/src/auth/session";
import { useI18n } from "@/src/i18n/context";

export default function LoginScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function goToRegister() {
    Keyboard.dismiss();
    emailRef.current?.blur();
    passwordRef.current?.blur();
    setError("");
    setEmail("");
    setPassword("");
    InteractionManager.runAfterInteractions(() => {
      router.push("/(auth)/register");
    });
  }

  async function onLogin() {
    try {
      setBusy(true);
      setError("");

      const res = await login({ email: email.trim(), password });
      const { token, user } = res.data;

      await setSession(token, user);

      offerBiometricEnrollmentAfterAuth(router, t);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError(t("errors.wrongEmailOrPassword"));
        } else {
          setError(e.message.trim() ? e.message : t("errors.loginFailed"));
        }
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
          setError(m || t("errors.loginFailed"));
        }
      } else {
        setError(t("errors.loginFailed"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 8, marginTop: 10 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("login.accessControl")}
        </Text>

        <Text style={{ fontSize: 28, fontWeight: "900", letterSpacing: 0.5 }}>
          {t("login.brandKarma")}
          <Text style={{ color: "#FF2DAA" }}>{t("login.brandLock")}</Text>
        </Text>

        <Text dim style={{ marginTop: 6 }}>
          {t("login.subtitle")}
        </Text>
      </View>

      {/* Form */}
      <View style={{ marginTop: 28, gap: 12 }}>
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            {t("login.email")}
          </Text>
          <TextInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder={t("login.placeholderEmail")}
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
            {t("login.password")}
          </Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            placeholder="••••••••"
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

        {error ? (
          <Text style={{ color: "tomato", marginTop: 6 }}>{error}</Text>
        ) : null}

        <View style={{ marginTop: 8, gap: 10 }}>
          <Button
            title={busy ? t("login.signingIn") : t("login.signIn")}
            onPress={onLogin}
            disabled={busy || !email.trim() || !password}
          />

          <Button
            title={t("login.createAccount")}
            variant="ghost"
            onPress={goToRegister}
            disabled={busy}
          />

          <LanguageFlagSwitcher />
        </View>
      </View>

      {/* Footer */}
      <View style={{ marginTop: "auto", paddingBottom: 24 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("login.systemStatus")}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "rgba(57,217,138,1)",
            }}
          />
          <Text style={{ fontSize: 16, fontWeight: "800" }}>
            {t("login.online")}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
