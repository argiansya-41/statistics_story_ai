"use client";

import React, { useEffect, useRef, useState } from "react";
import { buildHelmRects, HELM_PALETTES } from "@/components/mascot/helmSprite";
import type { HelmVariant, Rect } from "@/components/mascot/helmSprite";

/**
 * Tiga maskot "helm" Statistics Story AI (konsep: public/mascots/konsep-maskot-helm.png).
 * Digambar sebagai SVG blok piksel 24x24 (tajam di semua ukuran), tanpa file gambar.
 *
 *   sigi : biru   | elemen AIR   | jambul tetesan air.
 *   mu   : merah  | elemen API   | jambul lidah api.
 *   quin : kuning | elemen PETIR | antena kilat biru.
 *   Aturan arena: air > api > petir > air.
 *
 * Kerangka tubuh identik; yang beda hanya jambul dan warna. Tampilan = karakter + pose + ekspresi + aksesori.
 * Ukuran terbaik: kelipatan 24px (w-12 = 48px 2x, w-[72px] 3x, w-24 = 96px 4x).
 */

export type MascotCharacter = "sigi" | "mu" | "quin";
export type MascotPose =
  | "idle" | "walk" | "run" | "wave" | "cheer" | "point" | "read" | "cast" | "charge" | "air" | "cover" | "peek"
  | "sit" | "dance" | "clap";
export type MascotFace =
  | "smile" | "happy" | "wink" | "think" | "wow" | "sad"
  | "angry" | "sleep" | "cool" | "love" | "flat" | "talk" | "ko" | "hurt"
  | "smug" | "shout" | "cry";
export type MascotTone = "blue" | "red" | "yellow";
/** cap = topi wisuda, crown = mahkota, scarf = syal. */
export type MascotOutfit = "none" | "cap" | "glasses" | "crown" | "scarf";

export const PALETTES = HELM_PALETTES;
const TONE_CHAR: Record<MascotTone, MascotCharacter> = { blue: "sigi", red: "mu", yellow: "quin" };

/**
 * Mata/mulut: "ink" = piksel hitam (terbaca di latar terang dan gelap), "hole" = lubang transparan persis
 * panel kanan gambar konsep. Wajah putih Quin sulit terbaca di latar terang bila memakai "hole".
 */
export const MASCOT_EYES: "ink" | "hole" = "ink";

const SEQUENCE: Record<MascotPose, { variants: HelmVariant[]; ms: number }> = {
  idle: { variants: ["idle"], ms: 500 },
  walk: { variants: ["walkA", "idle", "walkB", "idle"], ms: 150 },
  run: { variants: ["runA", "runB"], ms: 90 },
  wave: { variants: ["wave1", "wave2"], ms: 260 },
  cheer: { variants: ["cheer", "cheer2"], ms: 330 },
  point: { variants: ["point"], ms: 450 },
  read: { variants: ["read"], ms: 700 },
  cast: { variants: ["cast"], ms: 400 },
  charge: { variants: ["charge"], ms: 400 },
  air: { variants: ["air"], ms: 400 },
  cover: { variants: ["cover"], ms: 400 },
  peek: { variants: ["peek"], ms: 400 },
  sit: { variants: ["sit"], ms: 500 },
  dance: { variants: ["danceA", "danceB"], ms: 240 },
  clap: { variants: ["clapA", "clapB"], ms: 200 },
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Urutan ekspresi saat maskot diklik (mode interactive).
const FACE_CYCLE: MascotFace[] = ["wow", "happy", "love", "wink", "cool", "smug", "sad", "angry", "think", "sleep", "ko", "hurt", "cry"];

const CACHE = new Map<string, Rect[]>();
function getRects(character: MascotCharacter, palette: MascotCharacter, variant: HelmVariant, face: MascotFace, blink: boolean, talkOpen: boolean, outfit: MascotOutfit, crest: 0 | 1): Rect[] {
  const key = `${character}|${palette}|${variant}|${face}|${blink ? 1 : 0}|${talkOpen ? 1 : 0}|${outfit}|${crest}`;
  let r = CACHE.get(key);
  if (!r) {
    r = buildHelmRects({ character, palette, variant, face, blink, talkOpen, outfit, crest, eyes: MASCOT_EYES });
    CACHE.set(key, r);
  }
  return r;
}

interface MascotProps {
  character?: MascotCharacter;
  pose?: MascotPose;
  face?: MascotFace;
  tone?: MascotTone; // default mengikuti karakter
  outfit?: MascotOutfit;
  flip?: boolean;
  /** true = klik maskot untuk berganti ekspresi selama sekitar 2 detik. Jangan beri pointer-events-none di className. */
  interactive?: boolean;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  character = "sigi",
  pose = "idle",
  face = "smile",
  tone,
  outfit = "none",
  flip = false,
  interactive = false,
  className = "w-16 h-16",
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);
  const [blink, setBlink] = useState(false);
  const [crest, setCrest] = useState<0 | 1>(0);
  const [override, setOverride] = useState<MascotFace | null>(null);
  const visible = useRef(false);
  const clicks = useRef(0);
  const overrideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { if (overrideTimer.current) clearTimeout(overrideTimer.current); }, []);

  const onClick = () => {
    const next = FACE_CYCLE[clicks.current % FACE_CYCLE.length];
    clicks.current += 1;
    setOverride(next);
    if (overrideTimer.current) clearTimeout(overrideTimer.current);
    overrideTimer.current = setTimeout(() => setOverride(null), 2200);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(el);
    if (reduced) return () => io.disconnect();

    const seq = SEQUENCE[pose];
    const needsTick = seq.variants.length > 1 || face === "talk";
    const interval = needsTick
      ? setInterval(() => { if (visible.current) setTick((t) => t + 1); }, face === "talk" ? Math.min(seq.ms, 220) : seq.ms)
      : undefined;

    // Jambul bergoyang (api berkobar, tetesan memanjang, antena berpercik), tiap 280ms.
    const crestTimer = setInterval(() => { if (visible.current) setCrest((c) => (c === 0 ? 1 : 0)); }, 280);

    // Kedip acak tiap 2-4,5 detik, mata tertutup 140ms.
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        if (visible.current) {
          setBlink(true);
          openTimer = setTimeout(() => setBlink(false), 140);
        }
        scheduleBlink();
      }, rand(2000, 4500));
    };
    scheduleBlink();

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(crestTimer);
      if (blinkTimer) clearTimeout(blinkTimer);
      if (openTimer) clearTimeout(openTimer);
      io.disconnect();
    };
  }, [pose, face]);

  const seq = SEQUENCE[pose];
  const variant = seq.variants[tick % seq.variants.length];
  const palette = tone ? TONE_CHAR[tone] : character;
  const activeFace = override ?? face;
  const rects = getRects(character, palette, variant, activeFace, blink, tick % 2 === 0, outfit, crest);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMax meet"
      shapeRendering="crispEdges"
      className={interactive ? `${className} cursor-pointer` : className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      onClick={interactive ? onClick : undefined}
    >
      {rects.map((s, i) => (
        <rect key={i} x={s[0]} y={s[1]} width={s[2]} height={s[3]} fill={s[4]} />
      ))}
    </svg>
  );
};
