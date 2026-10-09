// Tujuan tombol "Coba Sekarang". Mengarah ke halaman masuk (login).
export const APP_URL = "/masuk";

// Bila aplikasi utama sudah punya alamat sendiri, isi NEXT_PUBLIC_APP_URL di .env.local.
// Setelah login/daftar berhasil (dan server terhubung), pengguna dialihkan ke alamat ini.
export const POST_AUTH_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
