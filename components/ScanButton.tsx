import { Text } from "@/components/common_components/Text";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

type Mode = "idle" | "scanning";

type Props = {
  mode?: Mode;
  onPress?: () => void;
  style?: ViewStyle;
};

const PINK = "#FF2DAA";

export function ScanButton({ mode = "idle", onPress, style }: Props) {
  // --- outer pulse rings ---
  const pulseA = useRef(new Animated.Value(0)).current;
  const pulseB = useRef(new Animated.Value(0)).current;

  // --- glow breathing ---
  const glow = useRef(new Animated.Value(0)).current;

  // --- inner falling orb ---
  const orb = useRef(new Animated.Value(0)).current;

  const scanning = mode === "scanning";

  const sizes = useMemo(() => {
    const SIZE = 260;
    const RING = Math.round(SIZE * 1.6); // outer pulse diameter
    return { SIZE, RING };
  }, []);

  useEffect(() => {
    // Pulse A (continuous)
    const pulseDuration = scanning ? 1500 : 2400;

    const loopPulse = (v: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(v, {
            toValue: 1,
            duration: pulseDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const a = loopPulse(pulseA, 0);
    const b = loopPulse(pulseB, Math.round(pulseDuration * 0.5));

    a.start();
    b.start();

    return () => {
      a.stop();
      b.stop();
      pulseA.setValue(0);
      pulseB.setValue(0);
    };
  }, [pulseA, pulseB, scanning]);

  useEffect(() => {
    const glowDuration = scanning ? 900 : 1500;
    const g = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: glowDuration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: glowDuration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    g.start();
    return () => {
      g.stop();
      glow.setValue(0);
    };
  }, [glow, scanning]);

  useEffect(() => {
    // Falling orb loop (top -> bottom, clipped in circle)
    const orbDuration = scanning ? 1200 : 1800;

    const o = Animated.loop(
      Animated.sequence([
        Animated.timing(orb, {
          toValue: 1,
          duration: orbDuration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(scanning ? 80 : 220),
        Animated.timing(orb, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    o.start();
    return () => {
      o.stop();
      orb.setValue(0);
    };
  }, [orb, scanning]);

  const pulseStyle = (v: Animated.Value) => {
    const scale = v.interpolate({
      inputRange: [0, 1],
      outputRange: [0.72, 1.02],
    });
    const opacity = v.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 0.4, 0],
    });
    return { transform: [{ scale }], opacity };
  };

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: scanning ? [0.55, 0.95] : [0.4, 0.7],
  });

  const orbTranslateY = orb.interpolate({
    inputRange: [0, 1],
    outputRange: [-sizes.SIZE * 0.55, sizes.SIZE * 0.55],
  });

  const orbOpacity = orb.interpolate({
    inputRange: [0, 0.12, 0.5, 0.88, 1],
    outputRange: [0, 0.22, 0.14, 0.22, 0],
  });

  const orbScale = orb.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.92, 1.03, 0.92],
  });

  return (
    <Pressable onPress={onPress} style={[styles.wrap, style]}>
      <View style={{ width: sizes.RING, height: sizes.RING }}>
        {/* Outer pulse rings */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              width: sizes.RING,
              height: sizes.RING,
              borderColor: PINK,
            },
            pulseStyle(pulseA),
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              width: sizes.RING,
              height: sizes.RING,
              borderColor: PINK,
            },
            pulseStyle(pulseB),
          ]}
        />

        {/* Button core */}
        <View
          style={[
            styles.core,
            {
              width: sizes.SIZE,
              height: sizes.SIZE,
              borderRadius: sizes.SIZE / 2,
            },
          ]}
        >
          {/* Glow */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                width: sizes.SIZE + 22,
                height: sizes.SIZE + 22,
                borderRadius: (sizes.SIZE + 22) / 2,
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Inner ring */}
          <View
            pointerEvents="none"
            style={[
              styles.innerRing,
              {
                width: sizes.SIZE,
                height: sizes.SIZE,
                borderRadius: sizes.SIZE / 2,
              },
            ]}
          />

          {/* Clip area for the falling orb + subtle sheen */}
          <View
            pointerEvents="none"
            style={[
              styles.clip,
              {
                width: sizes.SIZE - 10,
                height: sizes.SIZE - 10,
                borderRadius: (sizes.SIZE - 10) / 2,
              },
            ]}
          >
            {/* very subtle center haze */}
            <View style={styles.haze} />

            {/* falling orb */}
            <Animated.View
              style={[
                styles.orb,
                {
                  transform: [
                    { translateY: orbTranslateY },
                    { scale: orbScale },
                  ],
                  opacity: orbOpacity,
                },
              ]}
            />
          </View>

          {/* Text */}
          <View style={styles.textStack}>
            <Text style={styles.scanText}>SCAN</Text>

            <View style={styles.pill}>
              <Text muted mono style={styles.pillText}>
                INITIATE // NFC
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  pulseRing: {
    position: "absolute",
    left: 0,
    top: 0,
    borderWidth: 2,
    borderRadius: 9999,
  },

  core: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -130 }, { translateY: -130 }], // updated at runtime by size; keep symmetrical look
    alignItems: "center",
    justifyContent: "center",
  },

  glow: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [
      { translateX: -(260 + 22) / 2 },
      { translateY: -(260 + 22) / 2 },
    ],
    backgroundColor: "rgba(255,107,213,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: PINK,
        shadowOpacity: 0.9,
        shadowRadius: 36,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 12,
      },
    }),
  },

  innerRing: {
    position: "absolute",
    backgroundColor: "rgba(10,10,10,0.75)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.12)",
  },

  clip: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  haze: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,45,170,0.03)",
  },

  orb: {
    position: "absolute",
    left: "50%",
    width: 220,
    height: 220,
    marginLeft: -110,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.18)",
    ...Platform.select({
      ios: {
        shadowColor: "#ffffff",
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 6,
      },
    }),
  },

  textStack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  scanText: {
    fontSize: 78,
    fontWeight: "900",
    letterSpacing: 1,
  },

  pill: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  pillText: {
    letterSpacing: 2,
    fontSize: 12,
  },
});
