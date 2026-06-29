import AuthLayoutComponent from "@/components/layouts/auth-layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutComponent>{children}</AuthLayoutComponent>;
}
