import { deleteRemoteAccount } from "@/src/api/auth";
import {
  authenticateWithBiometric,
  biometricHardwareReady,
  getBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
} from "@/src/auth/biometrics";
import { clearSession, getUser, type SessionUser } from "@/src/auth/session";
import { useI18n } from "@/src/i18n/context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { formatVersionLine, getAppVersionAndBuild } from "./appVersion";
import { openExternalUrl } from "./openExternalUrl";
import { userDisplayInitial } from "./userInitial";

export function useSettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const versionLine = useMemo(() => {
    const { version, build } = getAppVersionAndBuild();
    return formatVersionLine(t("settings.versionValue"), version, build);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const u = await getUser();
        const av = await biometricHardwareReady();
        const on = await getBiometricUnlockEnabled();
        if (active) {
          setUser(u);
          setBioAvailable(av);
          setBioOn(on);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const toggleBiometrics = useCallback(async () => {
    if (!bioAvailable) return;
    if (bioOn) {
      await setBiometricUnlockEnabled(false);
      setBioOn(false);
      return;
    }
    const ok = await authenticateWithBiometric({
      promptMessage: t("biometric.enrollPrompt"),
      fallbackLabel: t("biometric.fallbackPasscode"),
      cancelLabel: t("biometric.cancel"),
    });
    if (ok) {
      await setBiometricUnlockEnabled(true);
      setBioOn(true);
    }
  }, [bioAvailable, bioOn, t]);

  const handleLogout = useCallback(async () => {
    await clearSession();
    router.replace("/(auth)/login");
  }, [router]);

  const handleDeleteConfirmed = useCallback(async () => {
    await deleteRemoteAccount();
    await clearSession();
    setDeleteOpen(false);
    router.replace("/(auth)/login");
  }, [router]);

  const openUrl = useCallback(
    async (url: string) => {
      const ok = await openExternalUrl(url);
      if (!ok) Alert.alert("", t("settings.linkUnavailable"));
    },
    [t],
  );

  const initial = userDisplayInitial(user);

  return {
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
  };
}
