import * as SecureStore from "expo-secure-store";

const KEY = "karmalock_onboarding_complete";

export async function getOnboardingComplete(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(KEY);
  return v === "1";
}

export async function setOnboardingComplete(): Promise<void> {
  await SecureStore.setItemAsync(KEY, "1");
}

/** Clears “seen onboarding” so the intro shows again (e.g. from login). */
export async function clearOnboardingComplete(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // No stored value yet — safe to ignore
  }
}
