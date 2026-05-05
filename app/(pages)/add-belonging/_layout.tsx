import { RegisterDraftProvider } from "@/components/features/register/RegisterDraftContext";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

export default function AddBelongingLayout() {
  const params = useLocalSearchParams<{ chipUid?: string }>();
  const initialChipUid = useMemo(
    () => (params.chipUid ? String(params.chipUid) : ""),
    [params.chipUid],
  );

  return (
    <RegisterDraftProvider initialChipUid={initialChipUid}>
      <Stack screenOptions={{ headerShown: false }} />
    </RegisterDraftProvider>
  );
}
