import SqlEditorView from "@/components/sql-editor/sql-editor-view";

export default async function SqlEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SqlEditorView />;
}
