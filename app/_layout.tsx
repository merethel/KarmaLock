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
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

import { onUnauthorized } from "../src/auth/authEvents";
import { getToken } from "../src/auth/session";

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

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // ✅ Auth gate + auto logout redirect
  useEffect(() => {
    (async () => {
      const token = await getToken();
      setReady(true);
      router.replace(token ? "/(tabs)" : "/(auth)/login");
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
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#000000" }, // extra safety
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-belonging"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}
