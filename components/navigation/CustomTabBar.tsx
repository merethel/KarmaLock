import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/common_components/Text";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <BlurView intensity={60} tint="dark" style={styles.blur}>
        {/* Dark overlay to avoid full transparency */}
        <View style={styles.overlay} />

        <View
          style={[
            styles.bar,
            {
              borderColor: "rgba(255,255,255,0.14)",
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : (options.title ?? route.name);

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName =
              route.name === "index"
                ? "home-outline"
                : route.name === "vault"
                  ? "briefcase-outline"
                  : "map-outline";

            const color = isFocused ? theme.tint : "rgba(255,255,255,0.55)";

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { opacity: 0.75 },
                ]}
              >
                {/* Active top indicator */}
                <View
                  style={[
                    styles.activeLine,
                    { backgroundColor: isFocused ? theme.tint : "transparent" },
                  ]}
                />

                <Ionicons name={iconName as any} size={24} color={color} />

                <Text mono style={[styles.label, { color }]}>
                  {String(label).toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 22 : 16,
    paddingTop: 10,
  },

  blur: {
    width: "92%",
    borderRadius: 999,
    overflow: "hidden",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)", // makes it readable, not transparent
  },

  bar: {
    height: 78,
    borderRadius: 999,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 10,

    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },

  item: {
    flex: 1,
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  activeLine: {
    position: "absolute",
    top: 10,
    width: 44,
    height: 4,
    borderRadius: 999,
  },

  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
