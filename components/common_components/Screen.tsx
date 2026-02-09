import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

type Props = ViewProps & {
  animate?: boolean;
};

export function Screen({ style, animate = true, children, ...rest }: Props) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  const isFocused = useIsFocused();

  const opacity = useSharedValue(1);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;

    if (isFocused) {
      opacity.value = 0;
      y.value = 10;

      opacity.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });

      y.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isFocused, animate]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      {...rest}
      style={[
        { flex: 1, backgroundColor: theme.background, marginBottom: 90 },
        animate && animStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
