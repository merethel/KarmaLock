import type { en } from "./messages/en";

export type Locale = "en" | "da";

type LeafPaths<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${string & K}`
    : T[K] extends object
      ? LeafPaths<T[K], `${Prefix}${string & K}.`>
      : never;
}[keyof T];

export type TranslationKey = LeafPaths<typeof en>;
