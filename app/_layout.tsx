import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

import { onUnauthorized } from "../src/auth/authEvents";
import { shouldUseBiometricGate } from "../src/auth/biometrics";
import { getToken } from "../src/auth/session";
import { I18nProvider } from "../src/i18n/context";
import { getOnboardingComplete } from "../src/onboarding/storage";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <I18nProvider>
      <RootLayoutNav />
    </I18nProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [navReady, setNavReady] = useState(false);

  // Auth gate, onboarding first launch, auto logout redirect
  useEffect(() => {
    (async () => {
      const token = await getToken();
      const onboardingDone = await getOnboardingComplete();
      if (token) {
        if (await shouldUseBiometricGate()) {
          router.replace("/unlock");
        } else {
          router.replace("/(tabs)");
        }
      } else if (!onboardingDone) {
        router.replace("/(auth)/onboarding");
      } else {
        router.replace("/(auth)/login");
      }
      setNavReady(true);
    })();

    const unsubscribe = onUnauthorized(() => {
      router.replace("/(auth)/login");
    });

    return unsubscribe;
  }, []);

  // Force navigator backgrounds to black to avoid white behind animations
  const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const AppTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: "#000000",
      card: "#000000",
    },
  };

  return (
    <ThemeProvider value={AppTheme}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000000" },
            gestureEnabled: true,
            animationMatchesGesture: true,
            ...(Platform.OS === "ios"
              ? { animation: "ios_from_right" as const }
              : {}),
            ...(Platform.OS === "android"
              ? { animation: "ios_from_right" as const }
              : {}),
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="unlock" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-belonging"
            options={{
              // Use a normal card push so iOS edge-swipe back feels native.
              presentation: "card",
              contentStyle: {
                flex: 1,
                backgroundColor: "#000000",
                justifyContent: "flex-start",
                alignItems: "stretch",
              },
            }}
          />
          <Stack.Screen
            name="belonging/[id]"
            options={{
              // Use a normal "card" push on iOS so the native interactive
              // back-swipe gesture feels smooth and familiar.
              presentation: "card",
              animation: Platform.OS === "ios" ? "ios_from_right" : "default",
              gestureEnabled: true,
              contentStyle: { backgroundColor: "#000000" },
            }}
          />
          <Stack.Screen
            name="belonging/[id]/edit"
            options={{
              // Use a normal card push so iOS edge-swipe back feels native.
              presentation: "card",
              animation: Platform.OS === "ios" ? "ios_from_right" : "default",
              gestureEnabled: true,
              contentStyle: { backgroundColor: "#000000" },
            }}
          />
          <Stack.Screen name="about-karmalock" />
        </Stack>
        {!navReady ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "#000000" },
            ]}
          />
        ) : null}
      </View>
    </ThemeProvider>
  );
}
