import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/common_components/Text";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

function getIcon(routeName: string) {
  if (routeName === "index") return "scan-outline";
  if (routeName === "vault") return "grid-outline";
  return "settings-outline";
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  // One animated value per tab: 0 = inactive, 1 = active
  const anim = useRef<Animated.Value[]>([]);

  // Ensure anim array length matches routes
  useEffect(() => {
    if (anim.current.length !== state.routes.length) {
      anim.current = state.routes.map(
        (_, i) => anim.current[i] ?? new Animated.Value(0),
      );
    }
    // animate to current focused
    state.routes.forEach((_, i) => {
      Animated.spring(anim.current[i], {
        toValue: state.index === i ? 1 : 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
        mass: 0.8,
      }).start();
    });
  }, [state.index, state.routes.length]);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <BlurView intensity={70} tint="dark" style={styles.blur}>
        <View style={styles.overlay} />

        <View style={[styles.bar, { borderColor: "rgba(255,255,255,0.14)" }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : (options.title ?? route.name);

            const isFocused = state.index === index;

            const onPress = () => {
              // small "tap pop" even if already focused
              Animated.sequence([
                Animated.spring(anim.current[index], {
                  toValue: 1.05,
                  useNativeDriver: true,
                  damping: 16,
                  stiffness: 320,
                  mass: 0.3,
                }),
                Animated.spring(anim.current[index], {
                  toValue: 1,
                  useNativeDriver: true,
                  damping: 18,
                  stiffness: 240,
                  mass: 0.6,
                }),
              ]).start();

              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const progress =
              anim.current[index] ?? new Animated.Value(isFocused ? 1 : 0);

            // Icon scales up slightly when focused
            const iconScale = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.12],
            });

            // Label fades a bit when inactive
            const labelOpacity = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            });

            // Active indicator scales in
            const lineScaleX = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            });

            // Optional subtle glow (opacity only)
            const glowOpacity = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.22],
            });

            const iconName = getIcon(route.name);
            const color = isFocused ? theme.tint : "rgba(255,255,255,0.55)";

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { opacity: 0.9 },
                ]}
              >
                {/* active top indicator */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.activeLine,
                    {
                      backgroundColor: theme.tint,
                      opacity: progress,
                      transform: [{ scaleX: lineScaleX }],
                    },
                  ]}
                />

                <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                  <Ionicons name={iconName as any} size={24} color={color} />
                </Animated.View>

                <Animated.View style={{ opacity: labelOpacity }}>
                  <Text mono style={[styles.label, { color }]}>
                    {String(label).toUpperCase()}
                  </Text>
                </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.35)",
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
