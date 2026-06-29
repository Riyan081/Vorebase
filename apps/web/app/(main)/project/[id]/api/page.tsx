import { IconFileText } from "@/lib/icons";
import ApiDocsView from "@/components/api-docs/api-docs-view";

export default async function ApiDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <IconFileText size={20} className="text-accent" />
              API Documentation
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Auto-generated REST API endpoints for your tables
            </p>
          </div>
        </div>

        <ApiDocsView projectId={id} />
      </div>
    </div>
  );
}
