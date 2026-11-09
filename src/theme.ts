import type { Severity } from "./services/bugs";

export const colors = {
  background: "#0F1117",
  surface: "#171A23",
  card: "#1F2330",
  border: "#2C3142",
  primary: "#14B8A6",
  primaryDark: "#0F766E",
  text: "#F1F5F9",
  muted: "#94A3B8",
  danger: "#EF4444",
  success: "#22C55E",
};

export const severityInfo: Record<Severity, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "#38BDF8" },
  media: { label: "Média", color: "#FACC15" },
  alta: { label: "Alta", color: "#F97316" },
  critica: { label: "Crítica", color: "#EF4444" },
};
