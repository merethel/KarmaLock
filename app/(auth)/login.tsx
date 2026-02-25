import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { login } from "@/src/api/auth"; // adjust if your path is different
import { setSession } from "@/src/auth/session"; // adjust if your path is different

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onLogin() {
    try {
      setBusy(true);
      setError("");

      const res = await login({ email: email.trim(), password });
      const { token, user } = res.data;

      await setSession(token, user);

      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={{ paddingTop: 24, paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 8, marginTop: 10 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          ACCESS CONTROL
        </Text>

        <Text style={{ fontSize: 28, fontWeight: "900", letterSpacing: 0.5 }}>
          KARMA<Text style={{ color: "#FF2DAA" }}>LOCK</Text>
        </Text>

        <Text dim style={{ marginTop: 6 }}>
          Sign in to manage your vault.
        </Text>
      </View>

      {/* Form */}
      <View style={{ marginTop: 28, gap: 12 }}>
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            EMAIL
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="merethe@test.com"
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
            PASSWORD
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
            title={busy ? "SIGNING IN..." : "SIGN IN"}
            onPress={onLogin}
            disabled={busy || !email.trim() || !password}
          />

          <Button
            title="CREATE ACCOUNT"
            variant="ghost"
            onPress={() => router.push("/(auth)/register")}
            disabled={busy}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={{ marginTop: "auto", paddingBottom: 24 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          SYSTEM STATUS
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
          <Text style={{ fontSize: 16, fontWeight: "800" }}>ONLINE</Text>
        </View>
      </View>
    </Screen>
  );
}
