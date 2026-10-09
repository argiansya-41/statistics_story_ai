import type { MascotFace } from "@/components/ui/Mascot";
import type { ActorId, Text } from "@/lib/mascotEngine";

/** Jembatan sederhana: komponen halaman memicu reaksi maskot tanpa saling mengimpor. */
export const MASCOT_EVENT = "mascot:react";

export interface MascotEventDetail {
  /** Hanya tampil bila section ini sedang dibaca (contoh: "demo"). Kosong = kapan saja. */
  section?: string;
  who?: ActorId;
  text: Text;
  face?: MascotFace;
  ms?: number;
}

export function emitMascot(detail: MascotEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<MascotEventDetail>(MASCOT_EVENT, { detail }));
}
