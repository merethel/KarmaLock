import { File, Paths } from "expo-file-system";

const FILE_NAME = "karmalock_self_revoked_grant_ids.json";

function dataFile(): File {
  return new File(Paths.document, FILE_NAME);
}

export async function loadSelfRevokedGrantIds(): Promise<Set<string>> {
  const f = dataFile();
  try {
    if (!f.exists) return new Set();
    const raw = await f.text();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string" && x.length > 0));
  } catch {
    return new Set();
  }
}

/** Call after the signed-in user revokes their own grant (unsubscribe) so we don’t treat it as “removed by owner”. */
export async function recordSelfRevokedGrantId(grantId: string): Promise<void> {
  const id = grantId.trim();
  if (!id) return;
  const f = dataFile();
  try {
    const prev = await loadSelfRevokedGrantIds();
    prev.add(id);
    if (!f.exists) f.create();
    f.write(JSON.stringify([...prev]));
  } catch {
    // ignore
  }
}
