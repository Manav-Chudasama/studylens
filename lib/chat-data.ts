import { requireUser } from "@/lib/auth";
import type { Citation, StudyConversation, StudyMessage } from "@/lib/study-types";

type ConversationRow = { id: string; title: string; updated_at: string };
type MessageRow = { id: string; role: "user" | "assistant"; content: string; citations: Citation[] | null };

export function toConversation(row: ConversationRow): StudyConversation {
  return {
    id: row.id,
    title: row.title,
    updatedLabel: new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(row.updated_at)),
    messages: [],
  };
}

export function toMessage(row: MessageRow): StudyMessage {
  return { id: row.id, role: row.role, content: row.content, citations: Array.isArray(row.citations) ? row.citations : [] };
}

/** List recent conversation headers from one owned notebook. */
export async function listConversations(notebookId: string) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase.from("conversations")
    .select("id,title,updated_at").eq("notebook_id", notebookId).eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Could not load chat history.");
  return (data as ConversationRow[]).map(toConversation);
}
