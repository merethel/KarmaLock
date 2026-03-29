import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { da } from "./messages/da";
import { en } from "./messages/en";
import { resolveMessage } from "./resolve";
import { getStoredLocale, setStoredLocale } from "./storage";
import type { Dictionary } from "./messages/en";
import type { Locale, TranslationKey } from "./types";

const dictionaries: Record<Locale, Dictionary> = { en, da };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const DEFAULT_LOCALE: Locale = "en";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getStoredLocale();
      if (!cancelled && stored) {
        setLocaleState(stored);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await setStoredLocale(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => resolveMessage(dictionaries[locale], key),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
