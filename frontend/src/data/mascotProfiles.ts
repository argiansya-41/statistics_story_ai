import type { ActorId, Text } from "@/lib/mascotEngine";

/** Identitas tiga maskot: dipakai untuk kartu nama, warna balon, dan glow aura. */
export interface MascotProfile {
  name: string;
  element: string;
  /** Lambang statistik yang diwakili. */
  symbol: string;
  role: Text;
  /** Warna aksen elemen dan warna teks di atasnya. */
  color: string;
  ink: string;
}

export const PROFILES: Record<ActorId, MascotProfile> = {
  sigi: { name: "Sigi", element: "AIR", symbol: "σ", role: { id: "AIR", en: "WATER" }, color: "#5BA8FF", ink: "#000000" },
  mu: { name: "Mu", element: "API", symbol: "μ", role: { id: "API", en: "FIRE" }, color: "#FF8A00", ink: "#000000" },
  quin: { name: "Quin", element: "PETIR", symbol: "Q", role: { id: "PETIR", en: "LIGHTNING" }, color: "#EBEB00", ink: "#000000" },
};
