import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { register } from "../../src/api/auth";
import { setSession } from "../../src/auth/session";

export default function RegisterScreen() {
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

      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    name.trim().length > 1 && email.trim().length > 3 && password.length >= 6;

  return (
    <Screen style={{ paddingTop: 24, paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 8, marginTop: 10 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          NEW IDENTITY
        </Text>

        <Text style={{ fontSize: 28, fontWeight: "900", letterSpacing: 0.5 }}>
          CREATE <Text style={{ color: "#FF2DAA" }}>ACCOUNT</Text>
        </Text>

        <Text dim style={{ marginTop: 6 }}>
          Register to lock items to your vault.
        </Text>
      </View>

      {/* Form */}
      <View style={{ marginTop: 28, gap: 12 }}>
        <View style={{ gap: 8 }}>
          <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
            NAME
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Merethe"
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
            placeholder="min 6 characters"
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
            title={busy ? "CREATING..." : "CREATE ACCOUNT"}
            onPress={onRegister}
            disabled={busy || !canSubmit}
          />

          <Button
            title="BACK TO LOGIN"
            variant="ghost"
            onPress={() => router.replace("/(auth)/login")}
            disabled={busy}
          />
        </View>
      </View>

      {/* Footer hint */}
      <View style={{ marginTop: "auto", paddingBottom: 24 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          NOTE
        </Text>
        <Text dim style={{ marginTop: 8 }}>
          Use a password you can remember. You’ll stay logged in until your
          token expires.
        </Text>
      </View>
    </Screen>
  );
}
