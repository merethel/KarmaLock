import { CustomTabBar } from "@/components/navigation/CustomTabBar";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "CMD" }} />
      <Tabs.Screen name="vault" options={{ title: "VAULT" }} />
      <Tabs.Screen name="radar" options={{ title: "RADAR" }} />
      <Tabs.Screen name="settings" options={{ title: "SETTINGS" }} />
    </Tabs>
  );
}
