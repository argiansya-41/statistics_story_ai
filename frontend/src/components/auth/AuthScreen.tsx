"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { authContent } from "@/data/authContent";
import type { StageKey } from "@/data/authContent";
import { POST_AUTH_URL } from "@/data/links";
import { forgotRequest, isDemoMode, loginRequest, registerRequest } from "@/lib/auth";
import type { AuthError } from "@/lib/auth";
import { EMPTY_VALUES, FIELD_ORDER, passwordStrength, validate } from "@/lib/authValidation";
import type { FieldKey, Mode, Values } from "@/lib/authValidation";
import { useLang } from "@/lib/useLang";
import { AuthStage } from "./AuthStage";
import { PasswordField, SubmitButton, TextField } from "./AuthFields";
import { PixelWipe } from "./PixelWipe";
import type { PixelWipeHandle } from "./PixelWipe";
import { StrengthMeter } from "./StrengthMeter";

const PATH: Record<Mode, string> = { login: "/masuk", register: "/daftar", forgot: "/lupa-sandi" };
const ORDER: Record<Mode, number> = { login: 0, register: 1, forgot: 2 };
const ACCENT: Record<Mode, string> = { login: "#003BFF", register: "#EBEB00", forgot: "#FF2E2E" };

type Status = "idle" | "submitting" | "success" | "error";

/** Memperbarui alamat dan judul tab tanpa memuat ulang halaman (dipisah agar aturan lint tidak menganggapnya mutasi state). */
function syncLocation(path: string, title: string) {
  window.history.replaceState(null, "", path);
  document.title = title;
}

export const AuthScreen: React.FC<{ initialMode: Mode }> = ({ initialMode }) => {
  const [lang, toggleLang] = useLang();
  const copy = authContent[lang];

  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [focusField, setFocusField] = useState<FieldKey | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [switching, setSwitching] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [hopKey, setHopKey] = useState(0);
  const [arrival, setArrival] = useState<"fall" | "dizzy" | "done">("fall");

  const wipe = useRef<PixelWipeHandle>(null);
  const busy = useRef(false);

  const m = copy.modes[mode];
  const accent = ACCENT[mode];
  const allErrors = useMemo(() => validate(mode, values), [mode, values]);
  const strength = passwordStrength(values.password);
  const visibleError = (f: FieldKey) =>
    attempted || touched[f] ? (allErrors[f] ? copy.errors[allErrors[f]!] : undefined) : undefined;

  // ---------- Keadaan panggung maskot ----------
  let stage: StageKey = "idle";
  if (arrival === "fall") stage = "landing";
  else if (arrival === "dizzy") stage = "dizzy";
  else if (switching) stage = "switching";
  else if (status === "success") stage = "success";
  else if (status === "submitting") stage = "submitting";
  else if (status === "error") stage = "error";
  else if (focusField === "password" || focusField === "confirm") stage = showPw ? "peek" : "password";
  else if (focusField === "name" || focusField === "email") stage = focusField;
  else if (mode === "register" && values.password.length > 0) stage = strength >= 3 ? "strong" : strength <= 1 ? "weak" : "idle";

  let bubble = "";
  if (stage === "idle") bubble = copy.stage.idleByMode[mode];
  else if (stage === "success") bubble = copy.stage.successByMode[mode];
  else if (stage === "error") bubble = formError ? copy.errors[formError] : copy.stage.error;
  else if (stage !== "switching") bubble = copy.stage[stage];
  if (stage === "landing" || stage === "dizzy") bubble = copy.stage[stage];

  // Kedatangan: maskot jatuh dari atas (dari tombol Coba Sekarang), pusing sebentar, lalu pulih.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setArrival("dizzy"), reduced ? 0 : 1800);
    const t2 = window.setTimeout(() => setArrival("done"), reduced ? 0 : 3700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Alihkan otomatis setelah berhasil, hanya bila server nyata terhubung dan alamat aplikasi diisi.
  useEffect(() => {
    if (status !== "success" || isDemoMode || !POST_AUTH_URL || mode === "forgot") return;
    const id = window.setTimeout(() => window.location.assign(POST_AUTH_URL), 1500);
    return () => window.clearTimeout(id);
  }, [status, mode]);

  // ---------- Pengisian ----------
  const setValue = <K extends FieldKey>(key: K, v: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (status === "error") {
      setStatus("idle");
      setFormError(null);
    }
  };
  const blur = (f: FieldKey) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setFocusField((cur) => (cur === f ? null : cur));
  };
  const focusEl = (f: FieldKey) => {
    const el = document.getElementById(`auth-${f}`);
    el?.focus();
  };

  // ---------- Kirim ----------
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting" || switching) return;
    setAttempted(true);
    const first = FIELD_ORDER[mode].find((f) => allErrors[f]);
    if (first) {
      setStatus("error");
      setFormError(null);
      setShakeKey((k) => k + 1);
      focusEl(first);
      return;
    }
    setStatus("submitting");
    setFormError(null);
    const result =
      mode === "login"
        ? await loginRequest(values.email, values.password)
        : mode === "register"
          ? await registerRequest({ name: values.name, email: values.email, password: values.password })
          : await forgotRequest(values.email);
    if (result.ok) {
      setStatus("success");
    } else {
      setFormError(result.error);
      setStatus("error");
      setShakeKey((k) => k + 1);
    }
  };

  // ---------- Pindah mode dengan transisi mosaik piksel ----------
  const switchMode = async (next: Mode) => {
    if (busy.current || next === mode || status === "submitting") return;
    busy.current = true;
    setSwitching(true);
    const dir: 1 | -1 = ORDER[next] > ORDER[mode] ? 1 : -1;
    await wipe.current?.cover(dir);

    setMode(next);
    setValues((v) => ({ ...EMPTY_VALUES, email: v.email })); // email dipertahankan, kata sandi dikosongkan
    setTouched({});
    setAttempted(false);
    setStatus("idle");
    setFormError(null);
    setShowPw(false);
    setFocusField(null);
    setHopKey((k) => k + 1);
    syncLocation(PATH[next], `${copy.modes[next].title} · Statistics Story AI`);

    await new Promise((r) => window.setTimeout(r, 90));
    await wipe.current?.reveal(dir);
    busy.current = false;
    setSwitching(false);
    if (window.innerWidth >= 1024) window.setTimeout(() => focusEl(next === "register" ? "name" : "email"), 60);
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") void switchMode("register");
    if (e.key === "ArrowLeft") void switchMode("login");
  };

  const loading = status === "submitting";
  const inputsDisabled = loading || switching;

  return (
    <main className="min-h-screen bg-black lg:grid lg:grid-cols-[1.02fr_1fr]">
      <AuthStage
        mode={mode}
        copy={copy}
        stage={stage}
        bubble={bubble}
        celebrate={status === "success"}
        shakeKey={shakeKey}
        hopKey={hopKey}
        lang={lang}
        arrival={arrival}
      />

      <section className="relative flex min-h-screen flex-col bg-[#F4F4F4] text-black bg-blueprint-grid">
        {/* Bilah atas: sel-sel berbingkai seperti navbar */}
        <div className="flex items-stretch justify-end border-b border-black bg-white">
          <Link href="/" className="font-mono-tech flex h-[52px] items-center border-l border-black px-5 text-[11px] font-bold tracking-widest transition-colors hover:bg-[#EBEB00] md:h-[60px]">
            ← {copy.back}
          </Link>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === "id" ? "Switch to English" : "Ganti ke bahasa Indonesia"}
            className="font-mono-tech flex h-[52px] items-center gap-2 border-l border-black px-5 text-[11px] font-bold tracking-widest transition-colors hover:bg-[#EBEB00] md:h-[60px]"
          >
            <span className={lang === "id" ? "" : "text-black/40"}>ID</span>
            <span className="text-black/30">/</span>
            <span className={lang === "en" ? "" : "text-black/40"}>EN</span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-10">
          <div
            className="relative w-full max-w-[520px] border border-black bg-white transition-[box-shadow] duration-300"
            style={{ boxShadow: `12px 12px 0 ${accent}` }}
          >
            {/* Tanda silang blueprint di sudut kartu */}
            {["-left-2 -top-2", "-right-2 -top-2", "-bottom-2 -left-2", "-bottom-2 -right-2"].map((pos) => (
              <span key={pos} aria-hidden="true" className={`pointer-events-none absolute ${pos} z-10 h-4 w-4`}>
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black" />
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black" />
              </span>
            ))}

            {mode !== "forgot" ? (
              <div role="tablist" aria-label={copy.tag} onKeyDown={onTabKey} className="relative grid grid-cols-2 border-b border-black">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-black transition-transform duration-[420ms] [transition-timing-function:steps(6,end)]"
                  style={{ transform: mode === "register" ? "translateX(100%)" : "translateX(0)" }}
                />
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={mode === t}
                    tabIndex={mode === t ? 0 : -1}
                    disabled={switching}
                    onClick={() => void switchMode(t)}
                    className={`font-mono-tech relative z-10 h-14 text-xs font-bold tracking-[0.18em] transition-colors duration-200 ${
                      mode === t ? "text-white" : "text-black hover:bg-[#EBEB00]"
                    }`}
                  >
                    {t === "login" ? copy.tabLogin : copy.tabRegister}
                  </button>
                ))}
              </div>
            ) : (
              <div className="border-b border-black">
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => void switchMode("login")}
                  className="font-mono-tech h-14 w-full px-6 text-left text-xs font-bold tracking-[0.18em] transition-colors hover:bg-[#EBEB00]"
                >
                  ← {copy.tabLogin}
                </button>
              </div>
            )}

            <div key={mode} role="tabpanel" className="auth-card-in p-6 md:p-10">
              {status === "success" ? (
                <div aria-live="polite" className="py-4">
                  <svg aria-hidden="true" viewBox="0 0 12 12" className="mb-6 h-14 w-14 auth-pop" shapeRendering="crispEdges">
                    <rect width="12" height="12" fill={accent} />
                    <path d="M2 6h2v2h1V7h1V6h1V5h1V4h1V3h1v1h-1v1H9v1H8v1H7v1H6v1H5v1H4V8H2z" fill={mode === "register" ? "#000" : "#fff"} />
                  </svg>
                  <h2 className="font-display text-[clamp(2rem,3.2vw,2.75rem)] font-normal leading-[1.05] tracking-[-0.035em]">{m.successTitle}</h2>
                  <p className="mt-4 font-sans text-base leading-snug text-black/70">{m.successBody}</p>
                  {isDemoMode && <p className="font-mono-tech mt-6 border border-black bg-[#EBEB00] p-3 text-[10px] font-bold tracking-wider">{copy.demoNotice}</p>}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={POST_AUTH_URL && !isDemoMode && mode !== "forgot" ? POST_AUTH_URL : "/"} className="font-mono-tech group inline-flex h-12 items-center gap-3 border border-black bg-[#EBEB00] px-6 text-xs font-bold tracking-widest transition-colors hover:bg-black hover:text-[#EBEB00]">
                      {copy.backHome} <span className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                    {mode === "forgot" && (
                      <button type="button" onClick={() => void switchMode("login")} className="font-mono-tech h-12 border border-black px-6 text-xs font-bold tracking-widest transition-colors hover:bg-black hover:text-white">
                        {copy.tabLogin}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-mono-tech mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-black/60">
                    <span aria-hidden="true" className="block h-2 w-2" style={{ background: accent }} />
                    {copy.tag}
                  </p>
                  <h2 className="font-display text-[clamp(2rem,3.2vw,2.75rem)] font-normal leading-[1.05] tracking-[-0.035em]">{m.title}</h2>
                  <p className="mb-7 mt-3 font-sans text-base leading-snug text-black/70">{m.subtitle}</p>

                  {status === "error" && formError && (
                    <div role="alert" className="auth-shake mb-5 border border-[#FF2E2E] bg-[#FF2E2E]/10 p-3 font-mono-tech text-xs leading-snug text-[#C40000]">
                      ! {copy.errors[formError]}
                    </div>
                  )}

                  <form noValidate onSubmit={submit} aria-label={m.title}>
                    {mode === "register" && (
                      <TextField
                        id="auth-name" index={0} label={copy.labels.name} value={values.name} accent={accent}
                        placeholder={copy.placeholders.name} autoComplete="name" disabled={inputsDisabled}
                        onChange={(v) => setValue("name", v)} onFocus={() => setFocusField("name")} onBlur={() => blur("name")}
                        error={visibleError("name")} valid={!allErrors.name}
                      />
                    )}
                    <TextField
                      id="auth-email" index={mode === "register" ? 1 : 0} label={copy.labels.email} type="email" inputMode="email"
                      value={values.email} accent={accent} placeholder={copy.placeholders.email} autoComplete="email" disabled={inputsDisabled}
                      onChange={(v) => setValue("email", v)} onFocus={() => setFocusField("email")} onBlur={() => blur("email")}
                      error={visibleError("email")} valid={!allErrors.email}
                    />
                    {mode !== "forgot" && (
                      <>
                        <PasswordField
                          id="auth-password" index={mode === "register" ? 2 : 1} label={copy.labels.password} value={values.password}
                          accent={accent} placeholder={copy.placeholders.password} disabled={inputsDisabled}
                          autoComplete={mode === "register" ? "new-password" : "current-password"}
                          visible={showPw} onToggle={() => setShowPw((s) => !s)} showLabel={copy.show} hideLabel={copy.hide}
                          onChange={(v) => setValue("password", v)} onFocus={() => setFocusField("password")} onBlur={() => blur("password")}
                          error={visibleError("password")}
                        />
                        {mode === "register" && (
                          <div className="auth-rise -mt-1 mb-4" style={{ animationDelay: "210ms" }}>
                            <StrengthMeter score={strength} labels={copy.strength} title={copy.strengthLabel} />
                          </div>
                        )}
                        {mode === "register" && (
                          <PasswordField
                            id="auth-confirm" index={3} label={copy.labels.confirm} value={values.confirm} accent={accent}
                            placeholder={copy.placeholders.confirm} autoComplete="new-password" disabled={inputsDisabled}
                            visible={showPw} onToggle={() => setShowPw((s) => !s)} showLabel={copy.show} hideLabel={copy.hide}
                            onChange={(v) => setValue("confirm", v)} onFocus={() => setFocusField("confirm")} onBlur={() => blur("confirm")}
                            error={visibleError("confirm")}
                          />
                        )}
                        {mode === "login" && (
                          <div className="auth-rise -mt-1 mb-5 flex justify-end" style={{ animationDelay: "140ms" }}>
                            <button
                              type="button"
                              disabled={switching}
                              onClick={() => void switchMode("forgot")}
                              className="font-mono-tech text-[11px] font-bold tracking-wider underline underline-offset-4 transition-colors hover:bg-[#EBEB00]"
                            >
                              {copy.forgotLink}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <SubmitButton
                      index={mode === "register" ? 4 : mode === "login" ? 2 : 1}
                      label={m.submit} loadingLabel={copy.submitting} loading={loading} disabled={switching}
                    />
                  </form>

                  {mode !== "forgot" && (
                    <p className="mt-7 border-t border-black/15 pt-5 font-sans text-sm text-black/70">
                      {m.switchQuestion}{" "}
                      <button
                        type="button"
                        disabled={switching}
                        onClick={() => void switchMode(mode === "login" ? "register" : "login")}
                        className="font-mono-tech text-xs font-bold tracking-wider text-black underline underline-offset-4 transition-colors hover:bg-[#EBEB00]"
                      >
                        {m.switchAction} →
                      </button>
                    </p>
                  )}
                  {mode === "forgot" && (
                    <p className="mt-7 border-t border-black/15 pt-5 font-sans text-sm text-black/70">
                      {m.switchQuestion}{" "}
                      <button type="button" disabled={switching} onClick={() => void switchMode("login")} className="font-mono-tech text-xs font-bold tracking-wider text-black underline underline-offset-4 transition-colors hover:bg-[#EBEB00]">
                        {m.switchAction} →
                      </button>
                    </p>
                  )}
                  {isDemoMode && (
                    <p className="font-mono-tech mt-5 flex items-start gap-2 text-[10px] leading-snug tracking-wide text-black/60">
                      <span aria-hidden="true" className="mt-0.5 block h-2 w-2 shrink-0 bg-[#EBEB00] outline outline-1 outline-black" />
                      {copy.demoNotice}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <p className="font-mono-tech px-6 pb-5 text-center text-[10px] tracking-widest text-black/40">© 2026 STATISTICS STORY AI</p>
      </section>

      <PixelWipe ref={wipe} />
    </main>
  );
};
