import { type ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { settingsTheme } from "./theme";

type Props = ViewProps & {
  children: ReactNode;
};

export function SettingsCard({ style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: settingsTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: settingsTheme.border,
    overflow: "hidden",
    paddingVertical: 4,
  },
});
