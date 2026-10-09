import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "outline-light" | "outline-dark" | "blue" | "text-link";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  showArrow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  showArrow = true,
}) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs tracking-wider",
    md: "px-6 py-3 text-xs tracking-widest",
    lg: "px-8 py-4 text-sm tracking-widest",
  };

  const variantClasses = {
    // Yellow electric + Black text (Scribe signature style)
    primary:
      "bg-[#EBEB00] text-[#000000] font-bold border border-[#000000] hover:bg-white hover:text-black",
    // Outline for dark sections
    "outline-light":
      "bg-transparent text-white border border-white/40 hover:border-white hover:bg-[#EBEB00] hover:text-black",
    // Outline for light sections
    "outline-dark":
      "bg-transparent text-black border border-black/40 hover:border-black hover:bg-[#EBEB00]",
    // Electric blue
    blue:
      "bg-[#003BFF] text-white font-semibold border border-[#003BFF] hover:bg-[#002ec7]",
    // Text link style with arrow
    "text-link":
      "bg-transparent text-current font-bold underline-offset-4 hover:underline !p-0 !border-0",
  };

  const baseClasses = `group inline-flex items-center justify-center gap-3 font-mono-tech font-bold uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${
    variant !== "text-link" ? sizeClasses[size] : "text-xs tracking-widest"
  } ${variantClasses[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
};
