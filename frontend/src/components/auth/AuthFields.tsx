"use client";

import React from "react";

const STEP_EASE = "[transition-timing-function:steps(6,end)]";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  type?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email";
  accent: string;
  valid?: boolean;
  right?: React.ReactNode;
  index: number;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** Bidang isian bergaya blueprint: label mono, batang fokus yang tumbuh bertahap, galat di bawahnya. */
export const TextField: React.FC<TextFieldProps> = ({
  id, label, value, onChange, onFocus, onBlur, type = "text", error, placeholder, autoComplete, inputMode,
  accent, valid, right, index, disabled, inputRef,
}) => (
  <div className="auth-rise" style={{ animationDelay: `${index * 70}ms` }}>
    <label htmlFor={id} className="mb-2 block font-mono-tech text-[11px] font-bold tracking-widest text-black">
      {label}
    </label>
    <div className="group relative">
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        spellCheck={false}
        autoCapitalize="none"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`h-14 w-full border bg-white px-4 pr-24 font-sans text-base text-black outline-none placeholder:text-black/35 disabled:opacity-60 ${
          error ? "border-[#FF2E2E] bg-[#FF2E2E]/5" : "border-black"
        }`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100 ${STEP_EASE}`}
        style={{ background: error ? "#FF2E2E" : accent }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {right}
        {valid && !error && !right && (
          <svg aria-hidden="true" viewBox="0 0 12 12" className="h-4 w-4" shapeRendering="crispEdges" fill="#003BFF">
            {[[1, 6], [2, 7], [3, 8], [4, 7], [5, 6], [6, 5], [7, 4], [8, 3], [9, 2], [10, 1]].map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={2} />
            ))}
          </svg>
        )}
      </div>
    </div>
    <p
      id={`${id}-error`}
      aria-live="polite"
      className={`min-h-[1.25rem] pt-1.5 font-mono-tech text-[11px] normal-case tracking-wide text-[#C40000] ${error ? "auth-shake" : ""}`}
    >
      {error ? `! ${error}` : ""}
    </p>
  </div>
);

interface PasswordFieldProps extends Omit<TextFieldProps, "type" | "right" | "valid"> {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ visible, onToggle, showLabel, hideLabel, ...rest }) => (
  <TextField
    {...rest}
    type={visible ? "text" : "password"}
    right={
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={visible}
        className="px-2 py-1 font-mono-tech text-[10px] font-bold tracking-widest text-black transition-colors hover:bg-[#EBEB00]"
      >
        {visible ? hideLabel : showLabel}
      </button>
    }
  />
);

interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled?: boolean;
  index: number;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ label, loadingLabel, loading, disabled, index }) => (
  <button
    type="submit"
    disabled={disabled || loading}
    aria-busy={loading}
    className="auth-rise group relative mt-1 flex h-14 w-full items-center justify-between border border-black bg-[#EBEB00] px-6 font-mono-tech text-sm font-bold tracking-widest text-black transition-colors duration-150 hover:bg-black hover:text-[#EBEB00] disabled:cursor-wait"
    style={{ animationDelay: `${index * 70}ms` }}
  >
    <span>{loading ? loadingLabel : label}</span>
    {loading ? (
      <span aria-hidden="true" className="flex items-end gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block w-2 bg-current" style={{ height: 14, animation: `auth-loader 720ms steps(4) ${i * 120}ms infinite` }} />
        ))}
      </span>
    ) : (
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1.5">→</span>
    )}
  </button>
);
