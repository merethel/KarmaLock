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

export type ScanChipUidStrings = {
  /** iOS NFC session prompt (shown by the OS). */
  iosAlertMessage: string;
  /** When native module isn't available (Expo Go / missing rebuild). */
  nfcUnavailable: string;
  /** Device doesn't support NFC. */
  nfcNotSupported: string;
  /** Tag scanned but we couldn't derive an ID. */
  noChipIdFound: string;
};

function loadNfcModule(strings: ScanChipUidStrings): NfcModule {
  // Avoid crashing at import time in runtimes without the native module
  // (e.g. Expo Go). If missing, throw a friendly error.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-nfc-manager") as NfcModule;
  } catch {
    throw new Error(strings.nfcUnavailable);
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
export async function scanChipUid(strings: ScanChipUidStrings): Promise<string> {
  const mod = loadNfcModule(strings);
  const NfcManager = mod.default;
  const { Ndef, NfcTech } = mod;

  const supported = await NfcManager.isSupported();
  if (!supported) throw new Error(strings.nfcNotSupported);

  await NfcManager.start();

  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: strings.iosAlertMessage,
    });
    const tag = await NfcManager.getTag();

    const fromText = parseTextFromNdef(tag, Ndef);
    const fromId = parseId(tag);
    const raw = fromText || fromId;

    if (!raw) throw new Error(strings.noChipIdFound);
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

