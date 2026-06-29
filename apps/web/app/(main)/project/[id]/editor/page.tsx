import TableEditorView from "@/components/table-editor/table-editor-view";

export default async function TableEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TableEditorView />;
}
