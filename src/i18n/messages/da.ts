import type { Dictionary } from "./en";

export const da: Dictionary = {
  onboarding: {
    brand: "KARMALOCK",
    skip: "Spring over",
    next: "Næste",
    getStarted: "Kom i gang",
    haveAccount: "Jeg har allerede en konto",
    protectTitle: "Beskyt dine ting",
    protectBody:
      "Registrer værdigenstande og kobl dem til NFC-klistermærker. Se beskyttet, stjålet og samlet værdi med ét blik.",
    scanTitle: "Scan med ét tryk",
    scanBody:
      "Åbn scanskærmen, tryk scan, og se detaljer og historik med det samme.",
    verifyTitle: "Bygget til verifikation",
    verifyBody:
      "Myndigheder kan scanne en mærket genstand og se tydelige oplysninger uden friktion.",
    readyTitle: "Du er klar",
    readyBody:
      "Log ind eller opret en konto for at styre dit vault og registrere nye aktiver.",
  },

  login: {
    accessControl: "ADGANGSKONTROL",
    brandKarma: "KARMA",
    brandLock: "LOCK",
    subtitle: "Log ind for at administrere dit vault.",
    email: "E-MAIL",
    placeholderEmail: "dig@eksempel.com",
    password: "ADGANGSKODE",
    signIn: "Log ind",
    signingIn: "Logger ind…",
    createAccount: "Opret konto",
    systemStatus: "SYSTEMSTATUS",
    online: "ONLINE",
    showIntroAgain: "Vis intro igen",
  },

  register: {
    newIdentity: "NY IDENTITET",
    titleCreate: "OPRET ",
    titleAccount: "KONTO",
    subtitle: "Registrer dig for at låse ting til dit vault.",
    name: "NAVN",
    placeholderName: "Dit navn",
    email: "E-MAIL",
    placeholderEmail: "dig@eksempel.com",
    password: "ADGANGSKODE",
    placeholderPasswordHint: "min. 6 tegn",
    creating: "Opretter…",
    submit: "Opret konto",
    backToLogin: "Tilbage til login",
    note: "NOTE",
    noteBody:
      "Brug en adgangskode du kan huske. Du forbliver logget ind indtil dit token udløber.",
  },

  home: {
    systemReady: "SYSTEM KLAR",
    brandKarma: "KARMA",
    brandLock: "LOCK",
    assets: "AKTIVER",
    system: "SYSTEM",
    online: "ONLINE",
    locking: "Låser…",
    verifyingNfc: "VERIFICERER NFC-SIGNATUR",
  },

  vault: {
    vaultIndex: "VAULT-INDEKS",
    title: "Dine ejendele",
    registeredAssets: "Registrerede aktiver",
    addNew: "Tilføj ny ejendel",
    loading: "Indlæser…",
    emptyTitle: "Ingen ejendele endnu",
    emptyBody:
      "Scan en chip på forsiden og registrer den for at tilføje din første genstand til vaultet.",
    chip: "CHIP",
    statusOk: "OK",
    statusStolen: "STJÅLET",
  },

  addBelonging: {
    processing: "Behandler…",
    analyzing: "Analyserer billede",
    newAsset: "NYT AKTIV",
    title: "Tilføj ejendel",
    chipUid: "CHIP-UID",
    chipPlaceholder: "Scan chip for at udfylde…",
    scanChipMock: "Scan chip (mock)",
    takePhotoAutofill: "Tag billede + autoudfyld",
    retakePhotoAutofill: "Tag billede igen + autoudfyld",
    aiConfidence: "AI-sikkerhed",
    titleField: "TITEL",
    titlePlaceholder: "f.eks. Trek FX 2 Disc",
    description: "BESKRIVELSE",
    descriptionPlaceholder: "Valgfri noter…",
    addToVault: "Tilføj til vault",
    cancel: "Annuller",
  },

  tabs: {
    cmd: "CMD",
    vault: "VAULT",
    settings: "INDSTILLINGER",
  },

  settings: {
    userPanel: "BRUGERPANEL",
    title: "Indstillinger",
    language: "Sprog",
    languageEnglish: "Engelsk",
    languageDanish: "Dansk",
    signOut: "Log ud",
    security: "SIKKERHED",
    signOutHint: "Når du logger ud, fjernes din session på denne enhed.",
    biometrics: "Biometrisk oplåsning",
    biometricsHint:
      "Når slået til, kræves Face ID, Touch ID eller fingeraftryk for at åbne appen med en gemt session.",
  },

  biometric: {
    unlockPrompt: "Lås KarmaLock op",
    unlockTitle: "Bekræft at det er dig",
    unlockHint: "Brug Face ID, Touch ID eller enhedskode.",
    fallbackPasscode: "Brug kode",
    cancel: "Annuller",
    enrollTitle: "Hurtigere næste gang?",
    enrollBody:
      "Brug Face ID eller fingeraftryk til at låse appen op næste gang. Du kan ændre dette under Indstillinger.",
    notNow: "Ikke nu",
    enable: "Aktivér",
    enrollPrompt: "Bekræft for at aktivere",
    retry: "Prøv igen",
    usePassword: "Log ind med adgangskode",
  },

  scan: {
    scan: "SCAN",
    initiateNfc: "START // NFC",
  },

  notFound: {
    title: "Ups!",
    message: "Denne skærm findes ikke.",
    goHome: "Gå til forsiden",
  },

  errors: {
    wrongEmailOrPassword:
      "Forkert e-mail eller adgangskode. Tjek dine oplysninger og prøv igen.",
    network: "Kunne ikke nå serveren. Tjek din forbindelse.",
    networkLocalhostOnDevice:
      "På en rigtig telefon er localhost telefonen selv. Sæt EXPO_PUBLIC_API_URL til din computers IP (samme Wi‑Fi) i .env, genstart Expo, og kør API'et på 0.0.0.0 — ikke kun localhost.",
    loginFailed: "Login mislykkedes",
    registrationFailed: "Registrering mislykkedes",
    loadBelongingsFailed: "Kunne ikke indlæse ejendele",
    failed: "Noget gik galt",
    createBelongingFailed: "Kunne ikke oprette ejendel",
    scanChipFirst: "Scan en chip først",
    missingChip: "Mangler chip-UID",
    titleRequired: "Titel er påkrævet",
  },
};
