import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import {
    Text as RNText,
    TextProps as RNTextProps,
    View as RNView,
    ViewProps as RNViewProps,
} from "react-native";

type Theme = typeof Colors.light;

function useTheme(): Theme {
  const scheme = useColorScheme() ?? "dark";
  return Colors[scheme];
}

export function ThemedView(props: RNViewProps & { surface?: boolean }) {
  const { style, surface, ...rest } = props;
  const theme = useTheme();

  return (
    <RNView
      {...rest}
      style={[
        {
          backgroundColor: surface
            ? "rgba(255,255,255,0.06)"
            : theme.background,
        },
        style,
      ]}
    />
  );
}

export function ThemedText(
  props: RNTextProps & { dim?: boolean; muted?: boolean; mono?: boolean },
) {
  const { style, dim, muted, mono, ...rest } = props;
  const theme = useTheme();

  const color = muted
    ? "rgba(255,255,255,0.40)"
    : dim
      ? "rgba(255,255,255,0.65)"
      : theme.text;

  return (
    <RNText
      {...rest}
      style={[{ color, fontFamily: mono ? "Courier" : undefined }, style]}
    />
  );
}

export function useThemeColor(colorName: keyof Theme) {
  const theme = useTheme();
  return theme[colorName];
}
