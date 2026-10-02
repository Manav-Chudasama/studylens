import type { StudyNotebook } from "@/lib/study-types";
import { requireUser } from "@/lib/auth";

type NotebookRow = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  materials?: { count: number }[];
  conversations?: { count: number }[];
};

function toNotebook(row: NotebookRow): StudyNotebook {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    materialCount: row.materials?.[0]?.count ?? 0,
    chatCount: row.conversations?.[0]?.count ?? 0,
  };
}

/** Read only the current user's notebooks. RLS enforces the same boundary. */
export async function listNotebooks() {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase.from("notebooks")
    .select("id,title,description,created_at,updated_at,materials(count),conversations(count)")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Could not load notebooks.");
  return (data as NotebookRow[]).map(toNotebook);
}

/** Return null when a notebook does not belong to the current user. */
export async function getNotebook(id: string) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase.from("notebooks")
    .select("id,title,description,created_at,updated_at")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error("Could not load notebook.");
  return data ? toNotebook(data as NotebookRow) : null;
}
