import { NotebookWorkspace } from "@/components/study/notebook-workspace";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { notebookIdSchema } from "@/lib/notebook-schema";
import { getNotebook } from "@/lib/notebooks";
import { listMaterials } from "@/lib/materials";
import { listConversations } from "@/lib/chat-data";

export default async function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!notebookIdSchema.safeParse(id).success) notFound();
  const [{ userId, email }, notebook] = await Promise.all([requireUser(), getNotebook(id)]);
  if (!notebook) notFound();
  const [initialMaterials, initialConversations] = await Promise.all([listMaterials(id), listConversations(id)]);
  return <NotebookWorkspace notebook={notebook} viewer={{ id: userId, displayName: email ?? "Student" }} initialMaterials={initialMaterials} initialConversations={initialConversations} />;
}
