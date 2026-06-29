import { IconSettings } from "@/lib/icons";
import GeneralSettingsForm from "@/components/settings/general-settings-form";

export default async function SettingsGeneralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <IconSettings size={20} className="text-accent" />
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">Manage your project configuration</p>
        </div>

        <GeneralSettingsForm projectId={id} />
      </div>
    </div>
  );
}
