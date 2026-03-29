import Colors from "@/constants/Colors";
import React from "react";
import { ActivityIndicator, Modal, useColorScheme, View } from "react-native";
import { Text } from "./Text";

export function LoadingOverlay({
  visible,
  title,
  subtitle,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
}) {
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ alignItems: "center", gap: 14 }}>
          <ActivityIndicator size="large" />

          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              letterSpacing: 1.2,
              color: theme.tint,
            }}
          >
            {title}
          </Text>

          <Text
            muted
            mono
            style={{
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
