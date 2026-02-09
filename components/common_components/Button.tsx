import Colors from "@/constants/Colors";
import React from "react";
import { Pressable, TextStyle, useColorScheme, ViewStyle } from "react-native";
import { Text } from "./Text";

type Variant = "solid" | "outline" | "ghost";

export function Button({
  title,
  onPress,
  variant = "solid",
  style,
  textStyle,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  const base: ViewStyle = {
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  };

  const variants: Record<Variant, ViewStyle> = {
    solid: {
      backgroundColor: theme.text,
      opacity: disabled ? 0.5 : 1,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: theme.text,
      opacity: disabled ? 0.5 : 1,
    },
    ghost: {
      backgroundColor: "transparent",
      opacity: disabled ? 0.5 : 1,
    },
  };

  const labelColor = variant === "solid" ? theme.background : theme.text;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[base, variants[variant], style]}
    >
      <Text
        style={[
          {
            fontSize: 16,
            fontWeight: "800",
            letterSpacing: 0.6,
            color: labelColor,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
