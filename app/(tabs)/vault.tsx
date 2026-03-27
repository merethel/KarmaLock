import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { Belonging, listMyBelongings } from "../../src/api/belongings";

export default function VaultScreen() {
  const [items, setItems] = useState<Belonging[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function load() {
    try {
      setError("");
      const res = await listMyBelongings();
      setItems(res.data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load belongings");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen style={{ paddingTop: 24, paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          VAULT INDEX
        </Text>

        <Text style={{ fontSize: 26, fontWeight: "900" }}>YOUR BELONGINGS</Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <Text dim>Registered assets</Text>
          <Text style={{ fontWeight: "900" }}>{items.length}</Text>
        </View>
        {/* ✅ Action */}
        <View style={{ marginTop: 14 }}>
          <Button
            title="ADD NEW BELONGING"
            variant="outline"
            onPress={() => router.push("/add-belonging")}
          />
        </View>
      </View>

      {/* Error */}
      {error ? (
        <Text style={{ color: "tomato", marginTop: 14 }}>{error}</Text>
      ) : null}

      {/* List */}
      <View style={{ flex: 1, marginTop: 16 }}>
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <Text dim style={{ marginTop: 20 }}>
                Loading...
              </Text>
            ) : (
              <View style={{ marginTop: 20, gap: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: "800" }}>
                  No belongings yet
                </Text>
                <Text dim>
                  Scan a chip in CMD and register it to add your first item to
                  the vault.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => <BelongingRow item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    </Screen>
  );
}

function BelongingRow({ item }: { item: Belonging }) {
  return (
    <Pressable
      onPress={() => {
        // Later: navigate to detail screen
      }}
      style={{
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>{item.title}</Text>

          {item.description ? (
            <Text dim numberOfLines={2}>
              {item.description}
            </Text>
          ) : (
            <Text muted mono style={{ letterSpacing: 1.6, fontSize: 12 }}>
              CHIP: {item.chipUid}
            </Text>
          )}
        </View>

        <StatusPill stolen={item.isStolen} />
      </View>
    </Pressable>
  );
}

function StatusPill({ stolen }: { stolen: boolean }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: stolen ? "rgba(255,80,80,0.45)" : "rgba(57,217,138,0.35)",
        backgroundColor: stolen
          ? "rgba(255,80,80,0.10)"
          : "rgba(57,217,138,0.08)",
      }}
    >
      <Text mono muted style={{ letterSpacing: 1.6, fontSize: 12 }}>
        {stolen ? "STOLEN" : "OK"}
      </Text>
    </View>
  );
}
