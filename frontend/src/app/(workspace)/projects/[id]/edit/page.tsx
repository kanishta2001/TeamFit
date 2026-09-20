import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/workspace-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // SQL Server uses a positive 32-bit integer for project IDs.
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  return <ProjectPage id={Number(id)} edit />;
}
