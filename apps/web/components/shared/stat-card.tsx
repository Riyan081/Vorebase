
import Link from "next/link";
import { IconArrowRight } from "@/lib/icons";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}

export default function StatCard({ icon, label, value, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group p-5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-border-light transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center">
          {icon}
        </div>
        <IconArrowRight size={14} className="text-text-muted group-hover:text-accent transition-colors" />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </Link>
  );
}
