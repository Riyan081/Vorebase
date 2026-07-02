import TableEditorView from "@/components/table-editor/table-editor-view";

export default async function TableEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // `id` is available for future use when connecting to real API
  const { id } = await params;
  void id;

  return <TableEditorView />;
}
