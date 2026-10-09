import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Masuk · Statistics Story AI",
  description: "Masuk ke Statistics Story AI untuk melanjutkan analisis, grafik, dan narasimu.",
};

export default function Page() {
  return <AuthScreen initialMode="login" />;
}
