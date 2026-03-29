import { Text } from "@/components/common_components/Text";
import { StyleSheet, View } from "react-native";

import { settingsTheme } from "./theme";
import { SettingsCard } from "./SettingsCard";

type Props = {
  email: string;
  accountLabel: string;
  initial: string;
};

export function SettingsProfileCard({
  email,
  accountLabel,
  initial,
}: Props) {
  return (
    <SettingsCard>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {email}
          </Text>
          <Text dim style={styles.profileSub}>
            {accountLabel}
          </Text>
        </View>
      </View>
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  textCol: { flex: 1, minWidth: 0 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: settingsTheme.avatarBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: settingsTheme.avatarLetter,
    fontSize: 22,
    fontWeight: "900",
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: "700",
  },
  profileSub: {
    fontSize: 13,
    marginTop: 4,
  },
});
