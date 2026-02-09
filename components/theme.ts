import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";

export function useTheme() {
  const scheme = useColorScheme() ?? "dark";
  return Colors[scheme];
}

export type Theme = ReturnType<typeof useTheme>;
