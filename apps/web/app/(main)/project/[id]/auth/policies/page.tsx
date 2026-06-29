import { IconShield } from "@/lib/icons";
import PoliciesView from "@/components/auth/policies-view";

export default async function AuthPoliciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <IconShield size={20} className="text-accent" />
            Row Level Security Policies
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Control access to your tables with fine-grained policies
          </p>
        </div>

        <PoliciesView />
      </div>
    </div>
  );
}
