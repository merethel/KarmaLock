import type { SessionUser } from "@/src/auth/session";

/** Single uppercase initial for avatar (name → email → "?"). */
export function userDisplayInitial(
  user: Pick<SessionUser, "name" | "email"> | null | undefined,
): string {
  const c =
    user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || "?";
  return c.toUpperCase();
}
