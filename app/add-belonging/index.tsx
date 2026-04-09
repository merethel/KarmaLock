import { LoadingOverlay } from "@/components/common_components/LoadingOverlay";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useI18n } from "@/src/i18n/context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RegisterIntroStep } from "@/components/register/RegisterIntroStep";
import { RegisterWizardHeader } from "@/components/register/RegisterWizardHeader";
import { registerStyles as s } from "@/components/register/registerStyles";

export default function AddBelongingIntroScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const theme = Colors[useColorScheme() ?? "dark"];

  const [busy, setBusy] = useState(false);

  const filledSegments = useMemo(() => 0, []);

  function confirmCancel() {
    // On intro, just go back.
    router.back();
  }

  return (
    <View
      style={[
        s.root,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <LoadingOverlay
        visible={busy}
        title={t("addBelonging.processing")}
        subtitle={t("addBelonging.analyzing")}
      />

      <View style={s.inner}>
        <RegisterWizardHeader
          t={t}
          step="intro"
          filledSegments={filledSegments}
          onBack={() => router.back()}
          onCancelRegistration={confirmCancel}
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <RegisterIntroStep
            t={t}
            onStart={() => {
              try {
                setBusy(false);
                router.push("/add-belonging/photos");
              } catch (e: unknown) {
                Alert.alert(
                  t("errors.failed"),
                  e instanceof Error ? e.message : t("errors.failed"),
                );
              }
            }}
          />
        </ScrollView>
      </View>
    </View>
  );
}

