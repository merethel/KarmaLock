import { apiFetch } from "./client";

export type UserSuggestion = {
  id: string;
  name?: string;
  email: string;
  imageUrl?: string;
};

export async function suggestUsersByEmail(query: string) {
  const q = query.trim();
  if (!q) return { data: { users: [] as UserSuggestion[] } };
  return apiFetch<{ users: UserSuggestion[] }>(
    `/users/suggest?email=${encodeURIComponent(q)}`,
  );
}

