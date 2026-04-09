type NfcModule = {
  default: {
    isSupported: () => Promise<boolean>;
    start: () => Promise<void>;
    requestTechnology: (
      tech: unknown,
      options?: { alertMessage?: string },
    ) => Promise<void>;
    getTag: () => Promise<any>;
    cancelTechnologyRequest: () => Promise<void>;
  };
  Ndef: any;
  NfcTech: any;
};

function loadNfcModule(): NfcModule {
  // Avoid crashing at import time in runtimes without the native module
  // (e.g. Expo Go). If missing, throw a friendly error.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-nfc-manager") as NfcModule;
  } catch {
    throw new Error(
      "NFC scanning isn’t available in this build. Rebuild the app with NFC support (development build / prebuild).",
    );
  }
}

function parseTextFromNdef(tag: any, Ndef: any): string {
  const msg = tag?.ndefMessage;
  if (!Array.isArray(msg)) return "";
  for (const rec of msg) {
    try {
      // Try Text record
      if (Ndef?.TNF_WELL_KNOWN === rec.tnf) {
        const type = Ndef.util.bytesToString(rec.type);
        if (type === "T") {
          const text = Ndef.text.decodePayload(rec.payload);
          if (typeof text === "string" && text.trim()) return text.trim();
        }
      }
    } catch {
      // ignore
    }
  }
  return "";
}

function parseId(tag: any): string {
  const id = tag?.id;
  if (!id) return "";
  return typeof id === "string" ? id : String(id);
}

/**
 * Scans an NFC tag and returns a chipUid.
 * Prefers NDEF Text payload if present, otherwise falls back to tag.id.
 */
export async function scanChipUid(): Promise<string> {
  const mod = loadNfcModule();
  const NfcManager = mod.default;
  const { Ndef, NfcTech } = mod;

  const supported = await NfcManager.isSupported();
  if (!supported) throw new Error("NFC not supported on this device");

  await NfcManager.start();

  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: "Hold your iPhone near the chip.",
    });
    const tag = await NfcManager.getTag();

    const fromText = parseTextFromNdef(tag, Ndef);
    const fromId = parseId(tag);
    const raw = fromText || fromId;

    if (!raw) throw new Error("No chip ID found on tag");
    return raw;
  } finally {
    // Always stop the NFC session.
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // ignore
    }
  }
}

