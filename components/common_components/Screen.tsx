import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import React from "react";
import { View, ViewProps } from "react-native";

export function Screen({ style, ...rest }: ViewProps) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  return (
    <View
      {...rest}
      style={[{ flex: 1, backgroundColor: theme.background }, style]}
    />
  );
}
