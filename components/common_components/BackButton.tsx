import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

export function BackButton({
  onPress,
  topInset = 0,
  style,
}: {
  onPress: () => void;
  topInset?: number;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { marginTop: topInset }, style]}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
      <Ionicons name="chevron-back" size={20} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
});

