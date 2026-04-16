export type PendingToast =
  | { type: "transferSent"; createdAt: number }
  | { type: "none"; createdAt: number };

let pending: PendingToast | null = null;

export function setPendingToast(toast: PendingToast): void {
  pending = toast;
}

export function consumePendingToast(): PendingToast | null {
  const v = pending;
  pending = null;
  return v;
}

