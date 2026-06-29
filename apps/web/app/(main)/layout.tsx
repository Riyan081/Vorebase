import type { Metadata } from "next";
import Link from "next/link";
import { VorebaseLogo } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Vorebase Studio",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
