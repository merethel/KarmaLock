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

  // Pulse progress for outer ring + halo
  const pulse = useSharedValue(0);
  // Breathing for inner glow
  const breathe = useSharedValue(0);
  // Rotating “scan arc” (only visible in scanning)
  const spin = useSharedValue(0);
  // Press feedback
  const press = useSharedValue(0);

  useEffect(() => {
    // idle pulse (slow)
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, {
        duration: mode === "scanning" ? 900 : 1600,
        easing: Easing.out(Easing.cubic),
      }),
      -1,
      false,
    );

    // inner breathe (very subtle)
    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, {
        duration: mode === "scanning" ? 900 : 1800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    // scanning spin
    if (mode === "scanning") {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      spin.value = 0;
    }
  }, [mode, pulse, breathe, spin]);

  const pressAnim = useAnimatedStyle(() => {
    const s = interpolate(press.value, [0, 1], [1, 0.985]);
    return { transform: [{ scale: s }] };
  });

  const outerPulseStyle = useAnimatedStyle(() => {
    const s = interpolate(pulse.value, [0, 1], [1, 1.12]);
    const o = interpolate(pulse.value, [0, 1], [0.35, 0]);
    return {
      opacity: o,
      transform: [{ scale: s }],
      borderColor: theme.tint,
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    const o = interpolate(breathe.value, [0, 1], [0.18, 0.28]);
    return { opacity: o };
  });

  const innerGlowStyle = useAnimatedStyle(() => {
    const o = interpolate(breathe.value, [0, 1], [0.08, 0.14]);
    return { opacity: o };
  });

  const arcStyle = useAnimatedStyle(() => {
    const r = interpolate(spin.value, [0, 1], [0, 360]);
    const o = mode === "scanning" ? 1 : 0;
    return {
      opacity: o,
      transform: [{ rotate: `${r}deg` }],
      borderTopColor: theme.tint,
      borderRightColor: "rgba(255,45,170,0.15)",
      borderBottomColor: "rgba(255,45,170,0.05)",
      borderLeftColor: "transparent",
    };
  });

  const titleColor = "#FFFFFF";

  return (
    <Animated.View style={[styles.wrap, style, pressAnim]}>
      {/* expanding pulse ring */}
      <Animated.View style={[styles.outerPulse, outerPulseStyle]} />

      {/* soft halo */}
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: theme.tint }, haloStyle]}
      />

      <Pressable
        onPress={() => {
          // small press “tap”
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

        {/* inner glow (subtle) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.innerGlow,
            { backgroundColor: theme.tint },
            innerGlowStyle,
          ]}
        />

        {/* scanning arc */}
        <Animated.View pointerEvents="none" style={[styles.arc, arcStyle]} />

        {/* content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>

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

const SIZE = 260;

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },

  outerPulse: {
    position: "absolute",
    width: SIZE + 34,
    height: SIZE + 34,
    borderRadius: 999,
    borderWidth: 2,
  },

  halo: {
    position: "absolute",
    width: SIZE + 60,
    height: SIZE + 60,
    borderRadius: 999,
    opacity: 0.22,
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
    width: SIZE * 1.05,
    height: SIZE * 1.05,
    borderRadius: 999,
    opacity: 0.12,
  },

  arc: {
    position: "absolute",
    width: SIZE - 18,
    height: SIZE - 18,
    borderRadius: 999,
    borderWidth: 3,
  },

  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  title: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: 1,
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
