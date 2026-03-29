import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
        animationMatchesGesture: true,
        ...(Platform.OS === "android"
          ? { animation: "ios_from_right" as const }
          : {}),
      }}
    />
  );
}
