import StorageView from "@/components/storage/storage-view";

export default async function StoragePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StorageView />;
}
