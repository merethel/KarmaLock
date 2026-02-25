import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { clearSession } from "../../src/auth/session";

export default function SettingsScreen() {
  const router = useRouter();

  async function handleLogout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  return (
    <Screen style={{ paddingTop: 24, paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 8 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          USER PANEL
        </Text>

        <Text style={{ fontSize: 26, fontWeight: "900" }}>SETTINGS</Text>
      </View>

      {/* Content */}
      <View style={{ marginTop: 28, gap: 16 }}>
        <Button title="SIGN OUT" variant="outline" onPress={handleLogout} />
      </View>

      {/* Footer */}
      <View style={{ marginTop: "auto", paddingBottom: 24 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          SECURITY
        </Text>
        <Text dim style={{ marginTop: 8 }}>
          Signing out removes your session from this device.
        </Text>
      </View>
    </Screen>
  );
}
