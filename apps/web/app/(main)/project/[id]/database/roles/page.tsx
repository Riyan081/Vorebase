import { IconShield } from "@/lib/icons";
import RolesList from "@/components/database/roles-list";

export default async function DatabaseRolesPage({
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
            Database Roles
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage the roles that have access to your database
          </p>
        </div>

        <RolesList />
      </div>
    </div>
  );
}
