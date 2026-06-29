import { mockTables } from "@/lib/mock-data";
import { IconDatabase, IconTable, IconKey } from "@/lib/icons";

export default async function DatabaseTablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <IconDatabase size={20} className="text-accent" />
            Database Schema
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Visual representation of your database tables and columns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTables.map((table) => (
            <div
              key={table.name}
              className="rounded-xl border border-border bg-bg-secondary overflow-hidden hover:border-border-light transition-all duration-200"
            >
              <div className="px-5 py-3 bg-bg-tertiary border-b border-border flex items-center gap-3">
                <IconTable size={16} className="text-accent" />
                <h3 className="text-sm font-semibold font-mono text-text-primary">{table.name}</h3>
                <span className="text-xs text-text-muted ml-auto">{table.rowCount.toLocaleString()} rows</span>
              </div>
              <div className="divide-y divide-border">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center gap-3 px-5 py-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {col.isPrimaryKey && <IconKey size={12} className="text-accent flex-shrink-0" />}
                      <span className="text-sm font-mono text-text-primary truncate">{col.name}</span>
                    </div>
                    <span className="text-xs font-mono text-text-muted px-2 py-0.5 rounded bg-bg-tertiary flex-shrink-0">
                      {col.type}
                    </span>
                    {!col.nullable && (
                      <span className="text-[9px] font-bold text-warning px-1 py-0.5 rounded bg-warning-muted flex-shrink-0">
                        NOT NULL
                      </span>
                    )}
                    {col.isUnique && !col.isPrimaryKey && (
                      <span className="text-[9px] font-bold text-info px-1 py-0.5 rounded bg-info-muted flex-shrink-0">
                        UNIQUE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
