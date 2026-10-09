/** Aturan validasi formulir. Murni (tanpa React) agar mudah diuji. */

export type Mode = "login" | "register" | "forgot";
export type Role = "mahasiswa" | "dosen" | "peneliti";

export interface Values {
  name: string;
  email: string;
  role?: Role | "";
  password: string;
  confirm: string;
}

export type FieldKey = keyof Values;

export type ErrorKey =
  | "nameRequired"
  | "nameShort"
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordShort"
  | "passwordWeak"
  | "confirmRequired"
  | "confirmMismatch"
  | "roleRequired";

export const EMPTY_VALUES: Values = { name: "", email: "", role: "", password: "", confirm: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Skor kekuatan kata sandi 0..4 (0 = kosong atau sangat lemah). */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12 && score < 4) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

export function validate(mode: Mode, v: Values): Partial<Record<FieldKey, ErrorKey>> {
  const e: Partial<Record<FieldKey, ErrorKey>> = {};
  const email = v.email.trim();

  if (!email) e.email = "emailRequired";
  else if (!EMAIL_RE.test(email)) e.email = "emailInvalid";

  if (mode === "forgot") return e;

  if (!v.password) e.password = "passwordRequired";
  else if (mode === "register") {
    if (v.password.length < 8) e.password = "passwordShort";
    else if (passwordStrength(v.password) < 2) e.password = "passwordWeak";
  }

  if (mode === "register") {
    const name = v.name.trim();
    if (!name) e.name = "nameRequired";
    else if (name.length < 2) e.name = "nameShort";
    if (!v.confirm) e.confirm = "confirmRequired";
    else if (v.confirm !== v.password) e.confirm = "confirmMismatch";
  }
  return e;
}

/** Urutan bidang di formulir, dipakai untuk memfokuskan bidang pertama yang salah. */
export const FIELD_ORDER: Record<Mode, FieldKey[]> = {
  login: ["email", "password"],
  register: ["name", "email", "password", "confirm"],
  forgot: ["email"],
};
