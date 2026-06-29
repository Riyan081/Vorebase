import { IconUsers } from "@/lib/icons";
import UsersView from "@/components/auth/users-view";

export default async function AuthUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <IconUsers size={20} className="text-accent" />
            Auth Users
          </h1>
        </div>

        <UsersView />
      </div>
    </div>
  );
}
