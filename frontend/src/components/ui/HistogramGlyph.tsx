import React from "react";

interface HistogramGlyphProps {
  className?: string;
  variant?: "default" | "blue" | "red" | "yellow" | "monochrome";
  size?: "sm" | "md" | "lg";
}

export const HistogramGlyph: React.FC<HistogramGlyphProps> = ({
  className = "",
  variant = "default",
  size = "md",
}) => {
  const heights = [
    size === "sm" ? "h-2" : size === "lg" ? "h-6" : "h-4",
    size === "sm" ? "h-3.5" : size === "lg" ? "h-8" : "h-6",
    size === "sm" ? "h-4.5" : size === "lg" ? "h-10" : "h-7",
    size === "sm" ? "h-2.5" : size === "lg" ? "h-5" : "h-3.5",
    size === "sm" ? "h-1.5" : size === "lg" ? "h-4" : "h-2.5",
  ];

  const barColors = {
    default: ["bg-[#003BFF]", "bg-[#FF2E2E]", "bg-[#EBEB00]", "bg-white", "bg-[#003BFF]"],
    blue: ["bg-[#003BFF]", "bg-[#003BFF]", "bg-[#003BFF]", "bg-white", "bg-[#003BFF]"],
    red: ["bg-[#FF2E2E]", "bg-[#FF2E2E]", "bg-[#FF2E2E]", "bg-white", "bg-[#FF2E2E]"],
    yellow: ["bg-[#EBEB00]", "bg-[#EBEB00]", "bg-[#EBEB00]", "bg-white", "bg-[#EBEB00]"],
    monochrome: ["bg-current", "bg-current", "bg-current", "bg-current", "bg-current"],
  };

  const selectedColors = barColors[variant];

  return (
    <div
      aria-hidden="true"
      className={`inline-flex items-end gap-[3px] select-none ${className}`}
    >
      {heights.map((h, idx) => (
        <span
          key={idx}
          className={`w-[3px] ${h} ${selectedColors[idx % selectedColors.length]} transition-transform duration-200 hover:scale-y-125`}
        />
      ))}
    </div>
  );
};
