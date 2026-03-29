import type { AiSuggestion } from "@/src/api/ai";

export type WizardStep = "intro" | "photos" | "edit" | "review";

export const PHOTO_COUNT = 3;

export function applySuggestionToFields(s: AiSuggestion) {
  return {
    title: (s.title || s.name || "").trim(),
    brand: (s.brand || "").trim(),
    model: (s.model || "").trim(),
    color: (s.color || "").trim(),
    category: (s.category || s.type || "").trim(),
    serialNumber: (s.serialNumber || "").trim(),
    estimatedValue:
      s.estimatedValue != null && s.estimatedValue !== ""
        ? String(s.estimatedValue)
        : s.attributes?.estimatedValue != null
          ? String(s.attributes.estimatedValue)
          : "",
    description: (s.description || "").trim(),
  };
}
