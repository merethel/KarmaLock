import { LanguageFlagSwitcher } from "@/components/LanguagePicker";
import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { DangerConfirmModal } from "@/components/common_components/DangerConfirmModal";
import { DangerRow } from "@/components/common_components/DangerRow";
import {
  SectionTitle,
  SettingsAccentSwitch,
  SettingsCard,
  SettingsProfileCard,
  SettingsRow,
  SettingsScreenHeader,
  settingsRowStyles,
} from "@/components/settings";
import { useSettingsScreen } from "@/src/settings/useSettingsScreen";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    t,
    user,
    bioAvailable,
    bioOn,
    notificationsOn,
    setNotificationsOn,
    deleteOpen,
    setDeleteOpen,
    versionLine,
    initial,
    toggleBiometrics,
    handleLogout,
    handleDeleteConfirmed,
    openUrl,
  } = useSettingsScreen();

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SettingsScreenHeader title={t("settings.headerTitle")} />

        <SettingsProfileCard
          email={user?.email ?? "—"}
          accountLabel={t("settings.karmaLockAccount")}
          initial={initial}
        />

        <SectionTitle label={t("settings.sectionPreferences")} />

        <SettingsCard>
          <SettingsRow
            icon="notifications-outline"
            title={t("settings.notifications")}
            subtitle={t("settings.notificationsSubtitle")}
            right={
              <SettingsAccentSwitch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
              />
            }
            showDivider
          />
          <SettingsRow
            icon="notifications-outline"
            title={t("settings.permissionStatus")}
            subtitle={t("settings.permissionNotRequested")}
            showDivider={!!bioAvailable}
          />
          {bioAvailable ? (
            <SettingsRow
              icon="finger-print-outline"
              title={t("settings.biometricTitle")}
              subtitle={t("settings.biometricSubtitle")}
              right={
                <SettingsAccentSwitch
                  value={bioOn}
                  onValueChange={() => void toggleBiometrics()}
                />
              }
            />
          ) : null}
        </SettingsCard>

        <Text dim style={styles.hint}>
          {bioAvailable
            ? t("settings.biometricDeviceHint")
            : t("settings.biometricUnavailableHint")}
        </Text>

        <SectionTitle label={t("settings.notifications")} />

        <SettingsCard>
          <SettingsRow
            icon="notifications-outline"
            title={t("settings.transfersInbox")}
            subtitle={t("settings.transfersInboxSubtitle")}
            chevron
            onPress={() => router.push("/transfers")}
          />
        </SettingsCard>

        <SectionTitle label={t("settings.sectionAbout")} />

        <SettingsCard>
          <SettingsRow
            icon="information-circle-outline"
            title={t("settings.aboutApp")}
            subtitle={t("settings.aboutAppSubtitle")}
            chevron
            onPress={() => router.push("/about-karmalock")}
            showDivider
          />
          <SettingsRow
            icon="hand-left-outline"
            title={t("settings.privacyPolicy")}
            subtitle={t("settings.privacySubtitle")}
            chevron
            onPress={() => void openUrl("https://karmalock.com/privacy")}
            showDivider
          />
          <SettingsRow
            icon="document-text-outline"
            title={t("settings.terms")}
            subtitle={t("settings.termsSubtitle")}
            chevron
            onPress={() => void openUrl("https://karmalock.com/terms")}
            showDivider
          />
          <SettingsRow
            icon="layers-outline"
            title={t("settings.version")}
            right={
              <Text style={settingsRowStyles.valueText}>{versionLine}</Text>
            }
          />
        </SettingsCard>

        <SectionTitle label={t("settings.sectionSupport")} />

        <SettingsCard>
          <SettingsRow
            icon="mail-outline"
            title={t("settings.supportContact")}
            subtitle={t("settings.supportEmail")}
            link
            onPress={() => void openUrl("mailto:support@karmalock.com")}
            showDivider
          />
          <SettingsRow
            icon="help-circle-outline"
            title={t("settings.faq")}
            subtitle={t("settings.faqSubtitle")}
            link
            onPress={() => void openUrl("https://karmalock.com/faq")}
          />
        </SettingsCard>

        <LanguageFlagSwitcher />

        <View style={styles.spacerMd} />

        <Button
          title={t("settings.signOut")}
          variant="outline"
          onPress={() => void handleLogout()}
        />

        <Text dim style={styles.signOutHint}>
          {t("settings.signOutHint")}
        </Text>

        <DangerRow
          title={t("settings.deleteAccount")}
          subtitle={t("settings.deleteSubtitle")}
          onPress={() => setDeleteOpen(true)}
          marginTop={20}
        />

        <View style={styles.spacerLg} />
      </ScrollView>

      <DangerConfirmModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title={t("settings.deleteModalTitle")}
        body={t("settings.deleteModalBody")}
        cancelLabel={t("settings.deleteModalCancel")}
        confirmLabel={t("settings.deleteModalConfirm")}
        waitLabel={(s) =>
          t("settings.deleteModalWait").replace("{{seconds}}", String(s))
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 24 },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    marginHorizontal: 6,
  },
  signOutHint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    textAlign: "center",
  },
  spacerMd: { height: 20 },
  spacerLg: { height: 32 },
});
