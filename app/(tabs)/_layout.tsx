import { CustomTabBar } from "@/components/navigation/CustomTabBar";
import { useI18n } from "@/src/i18n/context";
import { Tabs } from "expo-router";
import { Easing } from "react-native";

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        // Timing-only (no spring) so tab progress stays in [-1,0,1] for opacity.
        animation: "shift",
        transitionSpec: {
          animation: "timing",
          config: {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          },
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.cmd") }} />
      <Tabs.Screen name="vault" options={{ title: t("tabs.vault") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
