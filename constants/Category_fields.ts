const CATEGORY_FIELDS: Record<string, { key: string; label: string }[]> = {
  bicycle: [
    { key: "frameSize", label: "Frame size" },
    { key: "gearCount", label: "Gears" },
    { key: "type", label: "Type (road/mountain/city)" },
  ],
  ski: [
    { key: "lengthCm", label: "Length (cm)" },
    { key: "bootSize", label: "Boot size" },
    { key: "discipline", label: "Discipline" },
  ],
  tv: [
    { key: "screenSizeIn", label: "Screen size (in)" },
    { key: "resolution", label: "Resolution" },
    { key: "panelType", label: "Panel type" },
  ],
  other: [],
};
