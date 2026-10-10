import type { Language } from "@/data/content";
import type { ErrorKey, Mode, Role } from "@/lib/authValidation";

export type StageKey =
  | "idle" | "email" | "name" | "role" | "password" | "peek" | "weak" | "strong"
  | "submitting" | "error" | "success" | "switching" | "landing" | "dizzy";

interface ModeCopy {
  title: string;
  subtitle: string;
  submit: string;
  switchQuestion: string;
  switchAction: string;
  headline: [string, string];
  art: string;
  successTitle: string;
  successBody: string;
}

export interface AuthCopy {
  back: string;
  tag: string;
  tabLogin: string;
  tabRegister: string;
  modes: Record<Mode, ModeCopy>;
  labels: { name: string; email: string; role: string; password: string; confirm: string };
  placeholders: { name: string; email: string; password: string; confirm: string };
  show: string;
  hide: string;
  forgotLink: string;
  roles: Record<Role, { label: string; hint: string }>;
  strength: [string, string, string, string, string];
  strengthLabel: string;
  errors: Record<ErrorKey | "invalid" | "exists" | "network" | "server", string>;
  submitting: string;
  demoNotice: string;
  backHome: string;
  facts: string;
  stage: Record<StageKey, string> & { idleByMode: Record<Mode, string>; successByMode: Record<Mode, string> };
  toggleMascots: string;
}

export const authContent: Record<Language, AuthCopy> = {
  id: {
    back: "BERANDA",
    tag: "AKSES AKUN",
    tabLogin: "MASUK",
    tabRegister: "DAFTAR",
    modes: {
      login: {
        title: "Masuk",
        subtitle: "Lanjutkan ceritamu. Masuk untuk membuka analisis, grafik, dan narasimu.",
        submit: "MASUK",
        switchQuestion: "Belum punya akun?",
        switchAction: "Daftar sekarang",
        headline: ["Selamat datang", "kembali."],
        art: "Angka-angkamu sudah menunggu untuk bercerita.",
        successTitle: "Berhasil masuk",
        successBody: "Selamat datang kembali. Analisismu siap dilanjutkan.",
      },
      register: {
        title: "Buat akun",
        subtitle: "Cukup beberapa detik, lalu angkamu mulai bercerita.",
        submit: "BUAT AKUN",
        switchQuestion: "Sudah punya akun?",
        switchAction: "Masuk",
        headline: ["Mulai ceritakan", "angkamu."],
        art: "Narasi, grafik, dan contoh kasus nyata dalam satu tempat.",
        successTitle: "Akun berhasil dibuat",
        successBody: "Selamat datang di Statistics Story AI. Kamu sudah bisa mulai.",
      },
      forgot: {
        title: "Atur ulang kata sandi",
        subtitle: "Masukkan email akunmu, lalu kami kirimkan tautan untuk membuat kata sandi baru.",
        submit: "KIRIM TAUTAN",
        switchQuestion: "Ingat kata sandimu?",
        switchAction: "Kembali masuk",
        headline: ["Lupa kata sandi?", "Tenang."],
        art: "Hal seperti ini wajar. Kita atur ulang bersama.",
        successTitle: "Permintaan diterima",
        successBody: "Jika email itu terdaftar, tautan pengaturan ulang akan dikirim.",
      },
    },
    labels: { name: "NAMA LENGKAP", email: "EMAIL", role: "PERAN", password: "KATA SANDI", confirm: "ULANGI KATA SANDI" },
    placeholders: { name: "Nama lengkapmu", email: "nama@kampus.ac.id", password: "Minimal 8 karakter", confirm: "Ketik ulang kata sandi" },
    show: "TAMPILKAN",
    hide: "SEMBUNYIKAN",
    forgotLink: "Lupa kata sandi?",
    roles: {
      mahasiswa: { label: "Mahasiswa", hint: "Laporan & skripsi" },
      dosen: { label: "Dosen", hint: "Mengajar & demo" },
      peneliti: { label: "Peneliti", hint: "Pemula" },
    },
    strength: ["BELUM DIISI", "LEMAH", "CUKUP", "KUAT", "SANGAT KUAT"],
    strengthLabel: "KEKUATAN",
    errors: {
      nameRequired: "Nama wajib diisi.",
      nameShort: "Nama minimal 2 karakter.",
      emailRequired: "Email wajib diisi.",
      emailInvalid: "Format email belum benar.",
      passwordRequired: "Kata sandi wajib diisi.",
      passwordShort: "Minimal 8 karakter.",
      passwordWeak: "Tambahkan huruf besar, angka, atau simbol.",
      confirmRequired: "Ulangi kata sandimu.",
      confirmMismatch: "Kata sandi belum sama.",
      roleRequired: "Pilih salah satu peran.",
      invalid: "Email atau kata sandi salah.",
      exists: "Email ini sudah terdaftar. Coba masuk.",
      network: "Tidak bisa terhubung ke server. Periksa koneksimu.",
      server: "Terjadi kesalahan di server. Coba lagi sebentar lagi.",
    },
    submitting: "MEMERIKSA",
    demoNotice: "MODE DEMO: belum terhubung ke server. Data tidak dikirim atau disimpan.",
    backHome: "KE BERANDA",
    facts: "4 JENIS ANALISIS · 2 BAHASA NARASI · 3 JENIS GRAFIK",
    stage: {
      idle: "",
      idleByMode: { login: "Hai! Masuk untuk melanjutkan ceritamu.", register: "Halo! Yuk buat akunmu.", forgot: "Tenang, kita atur ulang bersama." },
      email: "Pakai email kampus atau pribadi, bebas.",
      name: "Siapa namamu? Biar narasinya terasa personal.",
      role: "Pilih perannya, supaya penjelasannya pas.",
      password: "Aku tidak melihat. Janji!",
      peek: "Eh... aku mengintip sedikit.",
      weak: "Coba tambah huruf besar, angka, atau simbol.",
      strong: "Kata sandi yang kuat. Mantap!",
      submitting: "Sebentar, sedang memeriksa...",
      error: "Ups, ada yang perlu diperbaiki.",
      success: "",
      successByMode: { login: "Berhasil! Selamat datang kembali.", register: "Akun jadi! Selamat datang!", forgot: "Permintaan diterima." },
      switching: "",
      landing: "WUAAAH!",
      dizzy: "Pusing... bintang di mana-mana.",
    },
    toggleMascots: "Maskot",
  },
  en: {
    back: "HOME",
    tag: "ACCOUNT ACCESS",
    tabLogin: "LOG IN",
    tabRegister: "SIGN UP",
    modes: {
      login: {
        title: "Log in",
        subtitle: "Pick up your story. Log in to open your analyses, charts, and narratives.",
        submit: "LOG IN",
        switchQuestion: "No account yet?",
        switchAction: "Sign up now",
        headline: ["Welcome", "back."],
        art: "Your numbers are waiting to tell their story.",
        successTitle: "Logged in",
        successBody: "Welcome back. Your analysis is ready to continue.",
      },
      register: {
        title: "Create account",
        subtitle: "Just a few seconds, then your numbers start telling stories.",
        submit: "CREATE ACCOUNT",
        switchQuestion: "Already have an account?",
        switchAction: "Log in",
        headline: ["Start telling", "your numbers."],
        art: "Narratives, charts, and real-world examples in one place.",
        successTitle: "Account created",
        successBody: "Welcome to Statistics Story AI. You're ready to start.",
      },
      forgot: {
        title: "Reset password",
        subtitle: "Enter your account email and we'll send a link to set a new password.",
        submit: "SEND LINK",
        switchQuestion: "Remember your password?",
        switchAction: "Back to log in",
        headline: ["Forgot your", "password? Easy."],
        art: "It happens to everyone. Let's reset it together.",
        successTitle: "Request received",
        successBody: "If that email is registered, a reset link will be sent.",
      },
    },
    labels: { name: "FULL NAME", email: "EMAIL", role: "ROLE", password: "PASSWORD", confirm: "CONFIRM PASSWORD" },
    placeholders: { name: "Your full name", email: "name@university.edu", password: "At least 8 characters", confirm: "Type the password again" },
    show: "SHOW",
    hide: "HIDE",
    forgotLink: "Forgot password?",
    roles: {
      mahasiswa: { label: "Student", hint: "Reports & thesis" },
      dosen: { label: "Lecturer", hint: "Teaching & demos" },
      peneliti: { label: "Researcher", hint: "Early-career" },
    },
    strength: ["EMPTY", "WEAK", "FAIR", "STRONG", "VERY STRONG"],
    strengthLabel: "STRENGTH",
    errors: {
      nameRequired: "Name is required.",
      nameShort: "Name needs at least 2 characters.",
      emailRequired: "Email is required.",
      emailInvalid: "That email doesn't look right.",
      passwordRequired: "Password is required.",
      passwordShort: "At least 8 characters.",
      passwordWeak: "Add an uppercase letter, a number, or a symbol.",
      confirmRequired: "Please repeat your password.",
      confirmMismatch: "Passwords don't match yet.",
      roleRequired: "Choose one role.",
      invalid: "Wrong email or password.",
      exists: "This email is already registered. Try logging in.",
      network: "Can't reach the server. Check your connection.",
      server: "Something went wrong on the server. Please try again shortly.",
    },
    submitting: "CHECKING",
    demoNotice: "DEMO MODE: not connected to a server. No data is sent or stored.",
    backHome: "TO HOME",
    facts: "4 TYPES OF ANALYSIS · 2 NARRATIVE LANGUAGES · 3 CHART TYPES",
    stage: {
      idle: "",
      idleByMode: { login: "Hi! Log in to pick up your story.", register: "Hello! Let's create your account.", forgot: "Relax, we'll reset it together." },
      email: "Campus or personal email, your choice.",
      name: "What's your name? Makes the narrative personal.",
      role: "Pick a role so explanations fit you.",
      password: "I'm not looking. Promise!",
      peek: "Okay... I peeked a little.",
      weak: "Try adding capitals, numbers, or symbols.",
      strong: "Strong password. Nice!",
      submitting: "One moment, checking...",
      error: "Oops, something needs fixing.",
      success: "",
      successByMode: { login: "Done! Welcome back.", register: "Account ready! Welcome!", forgot: "Request received." },
      switching: "",
      landing: "WHOOOA!",
      dizzy: "Dizzy... stars everywhere.",
    },
    toggleMascots: "Mascots",
  },
};
