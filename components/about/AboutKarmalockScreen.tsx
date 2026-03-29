import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { AboutBulletList } from "@/components/about/AboutBulletList";
import { AboutInfoHeader } from "@/components/about/AboutInfoHeader";
import { AboutLearnMoreRow } from "@/components/about/AboutLearnMoreRow";
import { AboutNumberedList } from "@/components/about/AboutNumberedList";
import { AboutSectionCard } from "@/components/about/AboutSectionCard";
import {
  KARMALOCK_INSTAGRAM_URL,
  KARMALOCK_WEB_URL,
} from "@/components/about/urls";
import { settingsTheme } from "@/components/settings/theme";
import { openExternalUrl } from "@/src/settings/openExternalUrl";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export function AboutKarmalockScreen() {
  const { t } = useI18n();
  const router = useRouter();

  async function openLink(url: string) {
    const ok = await openExternalUrl(url);
    if (!ok) Alert.alert("", t("settings.linkUnavailable"));
  }

  const whatItems = [
    t("aboutKarmalock.what1"),
    t("aboutKarmalock.what2"),
    t("aboutKarmalock.what3"),
    t("aboutKarmalock.what4"),
    t("aboutKarmalock.what5"),
    t("aboutKarmalock.what6"),
  ];

  const howSteps = [
    {
      title: t("aboutKarmalock.how1Title"),
      body: t("aboutKarmalock.how1Body"),
    },
    {
      title: t("aboutKarmalock.how2Title"),
      body: t("aboutKarmalock.how2Body"),
    },
    {
      title: t("aboutKarmalock.how3Title"),
      body: t("aboutKarmalock.how3Body"),
    },
    {
      title: t("aboutKarmalock.how4Title"),
      body: t("aboutKarmalock.how4Body"),
    },
  ];

  const vaultItems = [
    t("aboutKarmalock.vault1"),
    t("aboutKarmalock.vault2"),
    t("aboutKarmalock.vault3"),
  ];

  return (
    <Screen
      style={[styles.screen, { marginBottom: 0, paddingTop: 0 }]}
      animate={false}
    >
      <AboutInfoHeader
        title={t("aboutKarmalock.headerTitle")}
        onBack={() => router.back()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AboutSectionCard sectionTitle={t("aboutKarmalock.sectionWhatIs")}>
          <AboutBulletList items={whatItems} />
        </AboutSectionCard>

        <AboutSectionCard sectionTitle={t("aboutKarmalock.sectionHow")}>
          <AboutNumberedList steps={howSteps} />
        </AboutSectionCard>

        <AboutSectionCard sectionTitle={t("aboutKarmalock.sectionVault")}>
          <AboutBulletList items={vaultItems} />
        </AboutSectionCard>

        <Text style={[styles.learnHeading, { color: settingsTheme.accent }]}>
          {t("aboutKarmalock.sectionLearnMore")}
        </Text>
        <AboutLearnMoreRow
          icon="globe-outline"
          label={t("aboutKarmalock.visitWebsite")}
          onPress={() => void openLink(KARMALOCK_WEB_URL)}
        />
        <AboutLearnMoreRow
          icon="logo-instagram"
          label={t("aboutKarmalock.followInstagram")}
          onPress={() => void openLink(KARMALOCK_INSTAGRAM_URL)}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },
  scroll: { paddingBottom: 40 },
  learnHeading: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 2,
  },
});
