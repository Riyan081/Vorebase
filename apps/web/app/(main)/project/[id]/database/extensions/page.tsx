import ExtensionsView from "@/components/database/extensions-view";

export default async function DatabaseExtensionsPage({
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
            🧩
            <span>Database Extensions</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Enable PostgreSQL extensions to add new functionality to your database
          </p>
        </div>

        <ExtensionsView />
      </div>
    </div>
  );
}
