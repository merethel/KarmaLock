import Colors from "@/constants/Colors";
import React from "react";
import { Text as RNText, TextProps, useColorScheme } from "react-native";

type Props = TextProps & {
  dim?: boolean;
  muted?: boolean;
  mono?: boolean;
};

export function Text({ style, dim, muted, mono, ...rest }: Props) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  const color = muted
    ? "rgba(255,255,255,0.40)"
    : dim
      ? "rgba(255,255,255,0.65)"
      : theme.text;

  return (
    <RNText
      {...rest}
      style={[
        {
          color,
          fontFamily: mono ? "Courier" : undefined,
        },
        style,
      ]}
    />
  );
}
