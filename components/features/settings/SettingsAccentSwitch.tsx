import { palette } from "@/constants/Colors";
import { settingsTheme } from "./theme";
import { Switch } from "react-native";

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const track = { false: "#333" as const, true: palette.accentTrack };

export function SettingsAccentSwitch({ value, onValueChange }: Props) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={track}
      thumbColor={value ? settingsTheme.accent : "#888"}
    />
  );
}
