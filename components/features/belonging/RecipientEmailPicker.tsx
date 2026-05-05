import { Text } from "@/components/common_components/Text";
import type { UserSuggestion } from "@/src/api/users";
import { suggestUsersByEmail } from "@/src/api/users";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";

export function RecipientEmailPicker({
  value,
  onChange,
  disabled,
  tEmailNotFound,
  tSearching,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
  placeholder: string;
  tSearching: string;
  tEmailNotFound: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [locked, setLocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState("");
  const reqSeq = useRef(0);

  useEffect(() => {
    // Reset internal state when value is cleared externally.
    if (!value.trim()) {
      setBusy(false);
      setError("");
      setSuggestions([]);
      setLocked(false);
      setLockedEmail("");
    }
  }, [value]);

  useEffect(() => {
    if (locked) return;
    const q = value.trim();
    setError("");

    if (q.length < 3) {
      setSuggestions([]);
      setBusy(false);
      return;
    }

    const handle = setTimeout(() => {
      void (async () => {
        const seq = ++reqSeq.current;
        try {
          setBusy(true);
          const res = await suggestUsersByEmail(q);
          const users = res.data.users ?? [];
          if (seq !== reqSeq.current) return;
          setSuggestions(users);
          if (q.includes("@") && users.length === 0) setError(tEmailNotFound);
        } catch {
          if (seq !== reqSeq.current) return;
          setSuggestions([]);
        } finally {
          if (seq !== reqSeq.current) return;
          setBusy(false);
        }
      })();
    }, 250);

    return () => clearTimeout(handle);
  }, [locked, tEmailNotFound, value]);

  return (
    <View>
      <Text muted mono style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={(v) => {
          const next = v;
          onChange(v);
          if (locked) {
            const a = lockedEmail.trim().toLowerCase();
            const b = next.trim().toLowerCase();
            if (a && b && a === b) return;
            setLocked(false);
          }
        }}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.45)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.input}
        editable={!disabled}
        returnKeyType="next"
      />

      {busy && !locked ? (
        <Text dim style={styles.helperText}>
          {tSearching}
        </Text>
      ) : null}

      {!locked && suggestions.length > 0 ? (
        <View style={styles.suggestionsBox}>
          <View style={styles.suggestionsContent}>
            {suggestions.slice(0, 3).map((u) => (
              <Pressable
                key={u.id}
                disabled={disabled}
                onPress={() => {
                  onChange(u.email);
                  setSuggestions([]);
                  setError("");
                  setLocked(true);
                  setLockedEmail(u.email);
                  Keyboard.dismiss();
                }}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={18}
                  color="rgba(255,255,255,0.65)"
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.suggestionPrimary} numberOfLines={1}>
                    {u.name || u.email}
                  </Text>
                  {u.name ? (
                    <Text dim style={styles.suggestionSecondary} numberOfLines={1}>
                      {u.email}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {!locked && !busy && error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { letterSpacing: 2.4, fontSize: 11, marginBottom: 8 },
  helperText: { marginTop: 10 },
  errorText: { marginTop: 10, color: "tomato" },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
  },
  suggestionsBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  suggestionsContent: { padding: 8, gap: 8 },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  suggestionPrimary: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },
  suggestionSecondary: { fontSize: 12, lineHeight: 16 },
});

