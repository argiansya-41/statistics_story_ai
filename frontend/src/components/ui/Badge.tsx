import React from "react";
import { HistogramGlyph } from "./HistogramGlyph";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "red" | "yellow" | "outline-dark" | "outline-light";
  withGlyph?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "outline-light",
  withGlyph = true,
  className = "",
}) => {
  const variantStyles = {
    // Blue background with white text (WCAG AA compliant)
    blue: "bg-[#003BFF] text-white border border-[#003BFF]",
    // Red background with black text (WCAG AA compliant per user instruction)
    red: "bg-[#FF2E2E] text-black font-bold border border-[#FF2E2E]",
    // Yellow background with black text (WCAG AA compliant)
    yellow: "bg-[#EBEB00] text-black font-bold border border-[#EBEB00]",
    // Outlines
    "outline-dark": "bg-transparent text-black border border-black/30",
    "outline-light": "bg-transparent text-white border border-white/30",
  };

  const glyphVariant =
    variant === "blue"
      ? "blue"
      : variant === "red"
      ? "red"
      : variant === "yellow"
      ? "yellow"
      : "default";

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1 font-mono-tech text-[11px] font-bold tracking-wider select-none ${variantStyles[variant]} ${className}`}
    >
      {withGlyph && <HistogramGlyph size="sm" variant={glyphVariant} />}
      <span>{children}</span>
    </div>
  );
};
