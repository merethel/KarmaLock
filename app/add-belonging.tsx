import { RegisterBelongingWizard } from "@/components/register/RegisterBelongingWizard";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

export default function AddBelongingScreen() {
  const params = useLocalSearchParams<{ chipUid?: string }>();

  const initialChip = useMemo(
    () => (params.chipUid ? String(params.chipUid) : ""),
    [params.chipUid],
  );

  return <RegisterBelongingWizard initialChipUid={initialChip} />;
}
