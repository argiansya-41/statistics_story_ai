"use client";

import React, { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789#%&@+*/<>=";
const DURATION = 950;

/**
 * Teks yang "diacak" menjadi teks baru, huruf demi huruf, setiap kali `text` berubah.
 * Versi tidak teracak tetap tersedia untuk pembaca layar.
 */
export const ScrambleText: React.FC<{ text: string; className?: string; style?: React.CSSProperties }> = ({
  text,
  className,
  style,
}) => {
  const [shown, setShown] = useState(text);
  const previous = useRef(text);

  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(text));
      return () => cancelAnimationFrame(id);
    }

    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const el = now - start;
      if (el >= DURATION) {
        setShown(text);
        return;
      }
      if (now - last > 36) {
        last = now;
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const settleAt = 160 + i * 24;
          out += ch === " " || el >= settleAt ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setShown(out);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <span className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
};
