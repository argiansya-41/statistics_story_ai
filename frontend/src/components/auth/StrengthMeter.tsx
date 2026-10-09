"use client";

import React from "react";

const HEIGHTS = [8, 13, 18, 23, 28];
const COLORS = ["#FF2E2E", "#FF2E2E", "#EBEB00", "#003BFF", "#003BFF"];

/** Pengukur kekuatan kata sandi berbentuk histogram lima batang. */
export const StrengthMeter: React.FC<{ score: 0 | 1 | 2 | 3 | 4; labels: string[]; title: string }> = ({ score, labels, title }) => {
  const filled = score === 0 ? 0 : score + 1; // 1..5 batang terisi
  return (
    <div className="flex items-end gap-4" role="meter" aria-label={title} aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={labels[score]}>
      <div className="flex h-8 items-end gap-1" aria-hidden="true">
        {HEIGHTS.map((h, i) => (
          <span
            key={i}
            className="block w-3 border border-black transition-colors duration-150"
            style={{ height: h, background: i < filled ? COLORS[Math.max(0, filled - 1)] : "#FFFFFF" }}
          />
        ))}
      </div>
      <div className="pb-0.5 font-mono-tech text-[10px] tracking-widest text-black/60">
        {title}: <span className="font-bold text-black">{labels[score]}</span>
      </div>
    </div>
  );
};
