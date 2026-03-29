import Constants from "expo-constants";

export function getAppVersionAndBuild(): { version: string; build: string } {
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = String(
    Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode ??
      1,
  );
  return { version, build };
}

/** Replace `{{version}}` and `{{build}}` in a template (e.g. i18n string). */
export function formatVersionLine(
  template: string,
  version: string,
  build: string,
): string {
  return template
    .replace("{{version}}", version)
    .replace("{{build}}", build);
}
