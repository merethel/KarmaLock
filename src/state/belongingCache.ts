import type { Belonging } from "@/src/api/belongings";

// Simple in-memory cache to avoid re-loading an item when navigating from Vault → Details.
// Not persisted across reloads; safe for “instant paint” on navigation.
const byId = new Map<string, Belonging>();

export function seedBelongingCache(items: Belonging[]): void {
  for (const it of items) byId.set(it._id, it);
}

export function cacheBelonging(item: Belonging): void {
  byId.set(item._id, item);
}

export function getCachedBelonging(id: string): Belonging | null {
  return byId.get(id) ?? null;
}

