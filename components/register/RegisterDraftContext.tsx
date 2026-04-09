import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Draft = {
  chipUid: string;
  setChipUid: (v: string) => void;

  photos: (string | null)[];
  setPhotos: React.Dispatch<React.SetStateAction<(string | null)[]>>;

  title: string;
  setTitle: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  serialNumber: string;
  setSerialNumber: (v: string) => void;
  estimatedValue: string;
  setEstimatedValue: (v: string) => void;
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;

  reset: () => void;
};

const Ctx = createContext<Draft | null>(null);

export function RegisterDraftProvider({
  initialChipUid,
  children,
}: {
  initialChipUid: string;
  children: React.ReactNode;
}) {
  const [chipUid, setChipUid] = useState(initialChipUid);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState("other");
  const [serialNumber, setSerialNumber] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [description, setDescription] = useState("");

  const reset = useCallback(() => {
    setChipUid(initialChipUid);
    setPhotos([null, null, null]);
    setTitle("");
    setBrand("");
    setModel("");
    setColor("");
    setCategory("other");
    setSerialNumber("");
    setEstimatedValue("");
    setPurchaseDate("");
    setDescription("");
  }, [initialChipUid]);

  const value = useMemo<Draft>(
    () => ({
      chipUid,
      setChipUid,
      photos,
      setPhotos,
      title,
      setTitle,
      brand,
      setBrand,
      model,
      setModel,
      color,
      setColor,
      category,
      setCategory,
      serialNumber,
      setSerialNumber,
      estimatedValue,
      setEstimatedValue,
      purchaseDate,
      setPurchaseDate,
      description,
      setDescription,
      reset,
    }),
    [
      brand,
      category,
      chipUid,
      color,
      description,
      estimatedValue,
      model,
      photos,
      purchaseDate,
      reset,
      serialNumber,
      title,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRegisterDraft(): Draft {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRegisterDraft must be used inside RegisterDraftProvider");
  return v;
}

