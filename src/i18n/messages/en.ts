/**
 * English strings — source of truth for keys. Danish must mirror this shape.
 */
export const en = {
  onboarding: {
    brand: "KARMALOCK",
    skip: "Skip",
    next: "Next",
    getStarted: "Get started",
    haveAccount: "I already have an account",
    protectTitle: "Protect your things",
    protectBody:
      "Register valuables and link them to NFC stickers. See protected, stolen, and total value at a glance.",
    scanTitle: "Scan in one tap",
    scanBody:
      "Open the scan screen, tap scan, and pull up item details and history instantly.",
    verifyTitle: "Built for verification",
    verifyBody:
      "Authorities can scan a tagged item and see clear information without friction.",
    readyTitle: "You're set",
    readyBody:
      "Sign in or create an account to manage your vault and register new assets.",
  },

  login: {
    accessControl: "ACCESS CONTROL",
    brandKarma: "KARMA",
    brandLock: "LOCK",
    subtitle: "Sign in to manage your vault.",
    email: "EMAIL",
    placeholderEmail: "you@example.com",
    password: "PASSWORD",
    signIn: "Sign in",
    signingIn: "Signing in…",
    createAccount: "Create account",
    systemStatus: "SYSTEM STATUS",
    online: "ONLINE",
    showIntroAgain: "Show introduction again",
  },

  register: {
    newIdentity: "NEW IDENTITY",
    titleCreate: "CREATE ",
    titleAccount: "ACCOUNT",
    subtitle: "Register to lock items to your vault.",
    name: "NAME",
    placeholderName: "Your name",
    email: "EMAIL",
    placeholderEmail: "you@example.com",
    password: "PASSWORD",
    placeholderPasswordHint: "min 6 characters",
    creating: "Creating…",
    submit: "Create account",
    backToLogin: "Back to login",
    note: "NOTE",
    noteBody:
      "Use a password you can remember. You'll stay logged in until your token expires.",
  },

  home: {
    systemReady: "SYSTEM READY",
    brandKarma: "KARMA",
    brandLock: "LOCK",
    assets: "ASSETS",
    system: "SYSTEM",
    online: "ONLINE",
    locking: "Locking…",
    verifyingNfc: "Verifying NFC signature",
  },

  vault: {
    vaultIndex: "VAULT INDEX",
    title: "Your belongings",
    registeredAssets: "Registered assets",
    addNew: "Add new belonging",
    loading: "Loading…",
    emptyTitle: "No belongings yet",
    emptyBody:
      "Scan a chip on the home screen and register it to add your first item to the vault.",
    chip: "CHIP",
    statusOk: "OK",
    statusStolen: "STOLEN",
  },

  addBelonging: {
    processing: "Processing…",
    analyzing: "Analyzing image",
    newAsset: "NEW ASSET",
    title: "Add belonging",
    chipUid: "CHIP UID",
    chipPlaceholder: "Scan chip to fill…",
    scanChipMock: "Scan chip (mock)",
    takePhotoAutofill: "Take photo + autofill",
    retakePhotoAutofill: "Retake photo + autofill",
    aiConfidence: "AI confidence",
    titleField: "TITLE",
    titlePlaceholder: "e.g. Trek FX 2 Disc",
    description: "DESCRIPTION",
    descriptionPlaceholder: "Optional notes…",
    addToVault: "Add to vault",
    cancel: "Cancel",
  },

  tabs: {
    cmd: "CMD",
    vault: "VAULT",
    settings: "SETTINGS",
  },

  settings: {
    userPanel: "USER PANEL",
    title: "Settings",
    language: "Language",
    languageEnglish: "English",
    languageDanish: "Danish",
    signOut: "Sign out",
    security: "SECURITY",
    signOutHint: "Signing out removes your session from this device.",
    biometrics: "Biometric unlock",
    biometricsHint:
      "When on, Face ID, Touch ID, or fingerprint is required to open the app with a saved session.",
  },

  biometric: {
    unlockPrompt: "Unlock KarmaLock",
    unlockTitle: "Confirm it’s you",
    unlockHint: "Use Face ID, Touch ID, or your device passcode.",
    fallbackPasscode: "Use passcode",
    cancel: "Cancel",
    enrollTitle: "Faster next time?",
    enrollBody:
      "Use Face ID or fingerprint to unlock the app on your next visit. You can change this anytime in Settings.",
    notNow: "Not now",
    enable: "Enable",
    enrollPrompt: "Confirm to enable",
    retry: "Try again",
    usePassword: "Sign in with password",
  },

  scan: {
    scan: "SCAN",
    initiateNfc: "INITIATE // NFC",
  },

  notFound: {
    title: "Oops!",
    message: "This screen doesn't exist.",
    goHome: "Go to home screen",
  },

  errors: {
    wrongEmailOrPassword:
      "Wrong email or password. Check your details and try again.",
    network: "Could not reach the server. Check your connection.",
    networkLocalhostOnDevice:
      "On a real phone, localhost is the phone itself. In .env set EXPO_PUBLIC_API_URL to your computer's LAN IP (same Wi‑Fi), restart Expo, and run your API bound to 0.0.0.0 (not only localhost).",
    loginFailed: "Login failed",
    registrationFailed: "Registration failed",
    loadBelongingsFailed: "Failed to load belongings",
    failed: "Something went wrong",
    createBelongingFailed: "Failed to create belonging",
    scanChipFirst: "Scan a chip first",
    missingChip: "Missing chip UID",
    titleRequired: "Title is required",
  },
} as const;

type StringTree<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: StringTree<T[K]> }
    : never;

/** Same nested keys as `en`, but every leaf is `string` (for locale files). */
export type Dictionary = { [K in keyof typeof en]: StringTree<(typeof en)[K]> };
