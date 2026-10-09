import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Buat akun · Statistics Story AI",
  description: "Buat akun Statistics Story AI dan mulai ubah angkamu menjadi cerita.",
};

export default function Page() {
  return <AuthScreen initialMode="register" />;
}
