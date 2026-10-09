import React from "react";

interface StepBlockProps {
  title: string;
  children: React.ReactNode;
  tone?: "light" | "dark"; // light = kotak putih (latar hitam), dark = kotak hitam (latar terang)
  className?: string;
}

export const StepBlock: React.FC<StepBlockProps> = ({
  title,
  children,
  tone = "light",
  className = "",
}) => {
  const box = tone === "light" ? "bg-white text-black" : "bg-black text-white";
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <h2
        className={`${box} max-w-[88%] px-5 py-3 md:px-6 md:py-4 font-display font-normal text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.035em]`}
      >
        {title}
      </h2>
      <div
        className={`${box} w-full max-w-[46rem] px-5 py-5 md:px-6 md:py-6 text-lg md:text-xl leading-[1.3] tracking-[-0.01em]`}
      >
        {children}
      </div>
    </div>
  );
};
