import { Button } from "@/components/common_components/Button";
import { Screen } from "@/components/common_components/Screen";
import { Text } from "@/components/common_components/Text";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { Belonging, listMyBelongings } from "../../src/api/belongings";
import { useI18n } from "../../src/i18n/context";

export default function VaultScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState<Belonging[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await listMyBelongings();
      setItems(res.data.items || []);
    } catch (e: any) {
      setError(e?.message || t("errors.loadBelongingsFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: "900" }}>
          {t("vault.title")}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <Text dim>{t("vault.registeredAssets")}</Text>
          <Text style={{ fontWeight: "900" }}>{items.length}</Text>
        </View>
        {/* ✅ Action */}
        <View style={{ marginTop: 14 }}>
          <Button
            title={t("vault.addNew")}
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
                {t("vault.loading")}
              </Text>
            ) : (
              <View style={{ marginTop: 20, gap: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: "800" }}>
                  {t("vault.emptyTitle")}
                </Text>
                <Text dim>{t("vault.emptyBody")}</Text>
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
  const { t } = useI18n();

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
              {t("vault.chip")}: {item.chipUid}
            </Text>
          )}
        </View>

        <StatusPill stolen={item.isStolen} />
      </View>
    </Pressable>
  );
}

function StatusPill({ stolen }: { stolen: boolean }) {
  const { t } = useI18n();

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
        {stolen ? t("vault.statusStolen") : t("vault.statusOk")}
      </Text>
    </View>
  );
}
