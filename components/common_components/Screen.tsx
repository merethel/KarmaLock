import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
  ViewProps,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

type Props = ViewProps & {
  animate?: boolean;
  /** Reserve space for bottom tab bar on tab screens. */
  withTabBarInset?: boolean;
  /** If false, don't wrap in touch-to-dismiss. */
  dismissKeyboardOnPress?: boolean;
  /** If false, don't use KeyboardAvoidingView. */
  keyboardAvoiding?: boolean;
};

export function Screen({
  style,
  animate = true,
  withTabBarInset = true,
  dismissKeyboardOnPress = true,
  keyboardAvoiding = true,
  children,
  ...rest
}: Props) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];
  const insets = useSafeAreaInsets();

  const isFocused = useIsFocused();

  const y = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;

    if (isFocused) {
      // Only nudge Y — never drive opacity to 0 here. Tab navigator already
      // animates scene opacity; multiplying with 0 → invisible / stuck blank.
      y.value = 8;
      y.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isFocused, animate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      {...rest}
      style={[
        {
          flex: 1,
          backgroundColor: theme.background,
          paddingBottom: withTabBarInset ? 90 : 0,
          paddingTop: insets.top + 12,
        },
        animate && animStyle,
        style,
      ]}
    >
      {dismissKeyboardOnPress ? (
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
          touchSoundDisabled
        >
          {keyboardAvoiding ? (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              // Keep this minimal; per-screen overrides can be added if needed.
              keyboardVerticalOffset={0}
            >
              <View style={{ flex: 1 }}>{children}</View>
            </KeyboardAvoidingView>
          ) : (
            <View style={{ flex: 1 }}>{children}</View>
          )}
        </TouchableWithoutFeedback>
      ) : (
        keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <View style={{ flex: 1 }}>{children}</View>
          </KeyboardAvoidingView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )
      )}
    </Animated.View>
  );
}
