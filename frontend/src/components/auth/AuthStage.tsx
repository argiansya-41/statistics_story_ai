"use client";

import React from "react";
import Link from "next/link";
import { GenerativeCanvas } from "@/components/ui/GenerativeCanvas";
import { GlitchStrip } from "@/components/ui/GlitchStrip";
import { Mascot } from "@/components/ui/Mascot";
import type { MascotCharacter, MascotFace, MascotOutfit, MascotPose } from "@/components/ui/Mascot";
import { ScrambleText } from "./ScrambleText";
import { Confetti } from "./Confetti";
import type { AuthCopy, StageKey } from "@/data/authContent";
import type { Mode } from "@/lib/authValidation";

interface Look {
  pose: MascotPose;
  face: MascotFace;
}

/** Ekspresi tiga maskot (Sigi, Mu, Quin) untuk tiap keadaan formulir. */
const LOOKS: Record<StageKey, [Look, Look, Look]> = {
  idle: [{ pose: "idle", face: "smile" }, { pose: "idle", face: "smile" }, { pose: "idle", face: "smile" }],
  email: [{ pose: "idle", face: "wink" }, { pose: "idle", face: "smile" }, { pose: "idle", face: "think" }],
  name: [{ pose: "idle", face: "talk" }, { pose: "idle", face: "talk" }, { pose: "idle", face: "talk" }],
  role: [{ pose: "point", face: "smile" }, { pose: "idle", face: "wink" }, { pose: "idle", face: "cool" }],
  password: [{ pose: "cover", face: "smile" }, { pose: "cover", face: "smile" }, { pose: "peek", face: "smile" }],
  peek: [{ pose: "peek", face: "wow" }, { pose: "peek", face: "smile" }, { pose: "idle", face: "wow" }],
  weak: [{ pose: "idle", face: "sad" }, { pose: "idle", face: "sad" }, { pose: "idle", face: "think" }],
  strong: [{ pose: "cheer", face: "happy" }, { pose: "idle", face: "cool" }, { pose: "cheer", face: "happy" }],
  submitting: [{ pose: "charge", face: "flat" }, { pose: "charge", face: "flat" }, { pose: "charge", face: "flat" }],
  error: [{ pose: "idle", face: "hurt" }, { pose: "idle", face: "sad" }, { pose: "idle", face: "hurt" }],
  success: [{ pose: "cheer", face: "happy" }, { pose: "cheer", face: "love" }, { pose: "cheer", face: "happy" }],
  switching: [{ pose: "cheer", face: "wow" }, { pose: "cheer", face: "wow" }, { pose: "cheer", face: "wow" }],
  landing: [{ pose: "air", face: "wow" }, { pose: "air", face: "hurt" }, { pose: "air", face: "wow" }],
  dizzy: [{ pose: "idle", face: "ko" }, { pose: "idle", face: "ko" }, { pose: "idle", face: "ko" }],
};

/** Maskot yang berbicara (indeks 0 = Sigi, 1 = Mu, 2 = Quin) pada tiap keadaan. */
const SPEAKER: Record<StageKey, 0 | 1 | 2> = {
  idle: 0, email: 2, name: 1, role: 0, password: 1, peek: 2, weak: 0, strong: 1, submitting: 2, error: 0, success: 1, switching: 0, landing: 0, dizzy: 1,
};

const CHARACTERS: MascotCharacter[] = ["sigi", "mu", "quin"];
const OUTFITS: MascotOutfit[] = ["none", "none", "glasses"];

const HEADLINE_STYLE: Record<Mode, { bg: string; fg: string }> = {
  login: { bg: "#003BFF", fg: "#FFFFFF" },
  register: { bg: "#EBEB00", fg: "#000000" },
  forgot: { bg: "#FFFFFF", fg: "#000000" },
};

/** Debu yang terlempar saat maskot menghantam lantai. */
const DUST = [[-34, -10], [-22, -26], [-8, -34], [8, -34], [22, -26], [34, -10]];
const LandingDust: React.FC<{ delay: number }> = ({ delay }) => (
  <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-0 w-0">
    {DUST.map(([dx, dy], k) => (
      <span
        key={k}
        className="absolute -left-1 bottom-0 block h-2 w-2 bg-white/80"
        style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px`, animation: `auth-dust 520ms steps(6) ${delay}ms both` }}
      />
    ))}
  </div>
);

/** Bintang berputar di atas kepala maskot yang pusing. */
const DizzyStars: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none absolute -top-1 left-1/2 z-10 -ml-6 h-12 w-12" style={{ animation: "mw-spin 1.1s steps(8) infinite" }}>
    {[{ left: 20, top: 0 }, { left: 3, top: 28 }, { left: 36, top: 28 }].map((pos, i) => (
      <span key={i} className="absolute block h-2.5 w-2.5 bg-[#EBEB00] outline outline-1 outline-black" style={pos} />
    ))}
  </div>
);

interface AuthStageProps {
  mode: Mode;
  copy: AuthCopy;
  stage: StageKey;
  bubble: string;
  celebrate: boolean;
  shakeKey: number;
  hopKey: number;
  lang: "id" | "en";
  /** Fase kedatangan: maskot jatuh dari atas, pusing, lalu pulih. */
  arrival: "fall" | "dizzy" | "done";
}

export const AuthStage: React.FC<AuthStageProps> = ({ mode, copy, stage, bubble, celebrate, shakeKey, hopKey, arrival }) => {
  const m = copy.modes[mode];
  const hs = HEADLINE_STYLE[mode];
  const looks = LOOKS[stage];
  const speaker = SPEAKER[stage];

  return (
    <aside className="relative flex min-h-[420px] flex-col overflow-hidden bg-black text-white bg-blueprint-grid-dark lg:sticky lg:top-0 lg:h-screen">
      <div aria-hidden="true" className="absolute inset-0 z-0 opacity-40">
        <GenerativeCanvas variant="ambient" />
      </div>

      {/* Logo (kotak bertangga seperti navbar) */}
      <div className="relative z-10 flex items-start">
        <div className="flex h-[76px] items-center border-b border-r border-white/20 bg-black px-4 md:h-[88px] md:px-7">
          <Link href="/" className="group flex select-none items-center gap-3" aria-label="Statistics Story AI">
            <svg className="h-5 w-5 text-[#003BFF] transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
              <path d="M3 20h18M3 20c4 0 6-1 7-7 1-6 2-10 2-10s1 4 2 10c1 6 3 7 7 7" />
            </svg>
            <span className="flex flex-col">
              <span className="font-display flex items-center gap-1.5 text-sm font-normal leading-tight tracking-tight md:text-base">
                Statistics Story <span className="font-medium text-[#003BFF]">AI</span>
              </span>
              <span className="font-mono-tech hidden text-[8px] tracking-wider text-white/50 sm:inline">INTERPRETATION CORE</span>
            </span>
          </Link>
        </div>
        <div className="font-mono-tech hidden flex-1 items-center justify-end self-stretch border-b border-white/20 px-6 text-[10px] tracking-widest text-white/45 md:flex">
          {copy.tag}
        </div>
      </div>

      {/* Judul bertangga (blok per baris, seperti hero) */}
      <div className="relative z-10 px-6 pb-4 pt-10 md:px-12 lg:pt-[7vh]">
        <h1 className="font-display text-[clamp(2.25rem,5vw,5rem)] font-normal leading-[1.14] tracking-[-0.035em]">
          {m.headline.map((line, i) => (
            <span key={i} className="block">
              <ScrambleText
                text={line}
                className="px-[0.14em]"
                style={{ background: hs.bg, color: hs.fg, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
              />
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-[34ch] font-sans text-lg leading-snug tracking-[-0.01em] text-white/75 md:text-xl">{m.art}</p>
        <p className="font-mono-tech mt-6 hidden text-[10px] tracking-widest text-white/45 lg:block">{copy.facts}</p>
      </div>

      {/* Panggung maskot */}
      <div className="relative z-10 mt-auto pt-16 lg:pt-0">
        <div key={shakeKey} className={`relative mx-auto flex max-w-[520px] items-end justify-center gap-4 px-6 pb-0 md:gap-8 ${shakeKey > 0 ? "auth-shake-big" : ""}`}>
          {looks.map((look, i) => (
            <div key={i} className="relative flex w-[72px] flex-col items-center md:w-24">
              {speaker === i && bubble && (
                <div
                  key={bubble}
                  className={`absolute bottom-full z-20 mb-3 w-max max-w-[220px] border border-black bg-white px-3 py-2 font-mono-tech text-[10px] leading-snug text-black ${
                    i === 0 ? "left-0" : i === 2 ? "right-0" : "left-1/2 -translate-x-1/2"
                  }`}
                  style={{ animation: "mw-bubble-in 200ms steps(3, end) both" }}
                  role="status"
                >
                  {bubble}
                  <span
                    className="absolute top-full -mt-px block h-1.5 w-1.5 bg-white"
                    style={{ left: i === 0 ? 36 : i === 2 ? undefined : "calc(50% - 3px)", right: i === 2 ? 36 : undefined, boxShadow: "1px 1px 0 0 #000" }}
                  />
                </div>
              )}
              {arrival === "fall" && <LandingDust delay={i * 240 + 780} />}
              {arrival === "dizzy" && <DizzyStars />}
              <div
                key={`hop-${hopKey}`}
                className={arrival === "fall" ? "auth-land" : undefined}
                style={
                  arrival === "fall"
                    ? ({ ["--land-delay" as string]: `${i * 240}ms` } as React.CSSProperties)
                    : hopKey > 0
                      ? { animation: "mw-hop 450ms steps(1, end) 1" }
                      : undefined
                }
              >
                <Mascot
                  character={CHARACTERS[i]}
                  pose={look.pose}
                  face={look.face}
                  outfit={OUTFITS[i]}
                  className="h-[72px] w-[72px] md:h-24 md:w-24"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="h-2 w-full bg-[#EBEB00]" />
        <GlitchStrip className="relative" />
      </div>

      {celebrate && <Confetti />}
    </aside>
  );
};
