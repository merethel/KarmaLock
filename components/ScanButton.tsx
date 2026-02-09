import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/common_components/Text";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

type Mode = "idle" | "scanning";

const SIZE = 270;

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function ScanButton({
  mode = "idle",
  onPress,
  style,
  title = "SCAN",
  subtitle = "INITIATE // NFC",
}: {
  mode?: Mode;
  onPress?: () => void;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
}) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  const pulse = useSharedValue(0);
  const breathe = useSharedValue(0);
  const sweep = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    // "pulse then rest" (feels like the reference)
    const pulseOut = mode === "scanning" ? 850 : 1250;
    const rest = mode === "scanning" ? 120 : 220;

    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, {
        duration: pulseOut,
        easing: Easing.out(Easing.cubic),
      }),
      -1,
      false,
    );

    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, {
        duration: mode === "scanning" ? 900 : 1800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    sweep.value = 0;
    sweep.value = withRepeat(
      withTiming(1, {
        duration: mode === "scanning" ? 900 : 1600,
        easing: Easing.linear, // key: no slowing / stopping
      }),
      -1,
      false,
    );
  }, [mode, pulse, breathe, sweep]);

  const pressAnim = useAnimatedStyle(() => {
    const s = interpolate(press.value, [0, 1], [1, 0.985]);
    return { transform: [{ scale: s }] };
  });

  // One ring that expands further + fades
  const outerPulseStyle = useAnimatedStyle(() => {
    const s = interpolate(pulse.value, [0, 1], [1, 1.33]); // go further out
    const o = interpolate(pulse.value, [0, 1], [0.55, 0]); // strong then gone
    return {
      opacity: o,
      transform: [{ scale: s }],
      borderColor: theme.tint,
    };
  });

  // Subtle background glow (barely visible)
  const haloStyle = useAnimatedStyle(() => {
    const o = interpolate(breathe.value, [0, 1], [0.05, 0.085]);
    return { opacity: o };
  });

  // Inner glow subtle
  const innerGlowStyle = useAnimatedStyle(() => {
    const o = interpolate(breathe.value, [0, 1], [0.08, 0.13]);
    return { opacity: o };
  });

  // Vertical sweep from top -> down
  const sweepStyle = useAnimatedStyle(() => {
    // Move a tall layer down across the circle
    const y = interpolate(sweep.value, [0, 1], [-SIZE, 0]);

    return {
      opacity: mode === "scanning" ? 0.34 : 0.22,
      transform: [{ translateY: y }],
    };
  });

  return (
    <Animated.View style={[styles.wrap, style, pressAnim]}>
      {/* subtle halo */}
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: theme.tint }, haloStyle]}
      />

      {/* single pulsing ring */}
      <Animated.View
        pointerEvents="none"
        style={[styles.outerPulse, outerPulseStyle]}
      />

      <Pressable
        onPress={() => {
          press.value = withSequence(
            withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) }),
          );
          onPress?.();
        }}
        style={styles.button}
      >
        {/* base circle */}
        <View style={styles.innerBase} />

        {/* inner glow */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.innerGlow,
            { backgroundColor: theme.tint },
            innerGlowStyle,
          ]}
        />

        {/* top->down wash */}
        <Animated.View
          pointerEvents="none"
          style={[styles.sweepWrap, sweepStyle]}
        >
          <LinearGradient
            colors={[
              hexToRgba(theme.tint, 0.65),
              hexToRgba(theme.tint, 0.18),
              "transparent",
            ]}
            locations={[0, 0.35, 1]}
            start={{ x: 0.5, y: -1 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.sweep}
          />
        </Animated.View>

        {/* content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.pill}>
            <Text mono style={styles.pillText}>
              {subtitle}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },

  halo: {
    position: "absolute",
    width: SIZE + 150,
    height: SIZE + 150,
    borderRadius: 999,
    opacity: 0.07,
  },

  outerPulse: {
    position: "absolute",
    width: SIZE + 46,
    height: SIZE + 46,
    borderRadius: 999,
    borderWidth: 2,
  },

  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  innerBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
  },

  innerGlow: {
    position: "absolute",
    width: SIZE * 1.06,
    height: SIZE * 1.06,
    borderRadius: 999,
    opacity: 0.12,
  },

  sweepWrap: {
    position: "absolute",
    width: SIZE * 1.15,
    height: SIZE * 2, // <-- key: tall layer so reset happens offscreen
    top: 0, // keep it anchored
    borderRadius: 999,
    overflow: "hidden",
  },

  sweep: { flex: 1 },

  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  title: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#FFFFFF",
  },

  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  pillText: {
    fontSize: 13,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.75)",
  },
});
