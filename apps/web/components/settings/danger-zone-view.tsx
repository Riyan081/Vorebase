"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsNav } from "@/components/layouts/settings-nav";
import ConfirmModal from "@/components/shared/confirm-modal";
import { useToast } from "@/components/shared/toast";

export default function DangerZoneView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(false);
    showToast("Project deleted successfully.", "success");
    router.push("/projects");
  };

  const handlePause = () => {
    setShowPauseModal(false);
    showToast("Project paused. All services are now disabled.", "info");
  };

  return (
    <>
      <SettingsNav projectId={projectId} />

      <div className="p-6 rounded-xl border border-danger/30 bg-danger-muted/5">
        <h2 className="text-base font-semibold text-danger mb-2">Danger Zone</h2>
        <p className="text-sm text-text-secondary mb-6">
          These actions are irreversible. Please proceed with extreme caution.
        </p>

        <div className="space-y-4">
          {/* Pause Project */}
          <div className="flex items-center justify-between p-5 rounded-lg border border-border bg-bg-secondary">
            <div>
              <p className="text-sm font-semibold text-text-primary">Pause Project</p>
              <p className="text-xs text-text-muted mt-0.5">
                Temporarily disable all services. Your data will be preserved and the project can be resumed at any time.
              </p>
            </div>
            <button
              onClick={() => setShowPauseModal(true)}
              className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg border border-warning/30 text-warning hover:bg-warning-muted text-sm font-medium transition-all"
            >
              Pause
            </button>
          </div>

          {/* Delete Project */}
          <div className="flex items-center justify-between p-5 rounded-lg border border-danger/20 bg-danger-muted/10">
            <div>
              <p className="text-sm font-semibold text-danger">Delete Project</p>
              <p className="text-xs text-text-muted mt-0.5">
                Permanently delete this project, all tables, users, storage files, and API keys. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg border border-danger/30 text-danger hover:bg-danger-muted text-sm font-medium transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        description="This will permanently delete the project, database, all tables, users, and storage. This action cannot be undone."
        confirmText="Delete Project"
      />
      <ConfirmModal
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onConfirm={handlePause}
        title="Pause Project"
        description="This will temporarily disable all API services for this project. Users will not be able to access the database or storage."
        confirmText="Pause Project"
        isDanger={false}
      />
    </>
  );
}
