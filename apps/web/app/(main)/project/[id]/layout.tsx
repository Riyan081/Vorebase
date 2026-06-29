import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
