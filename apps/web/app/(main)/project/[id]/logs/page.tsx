import { IconLogs } from "@/lib/icons";
import LogsView from "@/components/logs/logs-view";

export default async function LogsPage({
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
            <IconLogs size={20} className="text-accent" />
            Logs
          </h1>
          <p className="text-sm text-text-secondary mt-1">View logs from all services</p>
        </div>

        <LogsView />
      </div>
    </div>
  );
}
