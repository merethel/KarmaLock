type TransferUpdateStatus = "accepted" | "declined";

const seenUpdates = new Set<string>();

function key(id: string, status: TransferUpdateStatus): string {
  return `${id}:${status}`;
}

export function hasSeenTransferUpdate(
  id: string,
  status: TransferUpdateStatus,
): boolean {
  return seenUpdates.has(key(id, status));
}

export function markSeenTransferUpdate(
  id: string,
  status: TransferUpdateStatus,
): void {
  if (!id) return;
  seenUpdates.add(key(id, status));
}

