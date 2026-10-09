import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Atur ulang kata sandi · Statistics Story AI",
  description: "Atur ulang kata sandi akun Statistics Story AI-mu.",
};

export default function Page() {
  return <AuthScreen initialMode="forgot" />;
}
