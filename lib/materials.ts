import { requireUser } from "@/lib/auth";
import type { Material } from "@/lib/study-types";

export type MaterialRow = {
  id: string;
  title: string;
  kind: "pdf" | "txt" | "md" | "note";
  original_filename: string | null;
  storage_path: string | null;
  byte_size: number | null;
  content_text: string | null;
  status: "processing" | "ready" | "failed";
  index_status: "pending" | "indexing" | "ready" | "failed" | "unsupported";
  index_error: string | null;
  created_at: string;
};

export function toMaterial(row: MaterialRow): Material {
  const detail = row.kind === "note" ? "Pasted note" : `${row.kind.toUpperCase()} · ${formatBytes(row.byte_size ?? 0)}`;
  return {
    id: row.id,
    title: row.title,
    type: row.kind === "pdf" ? "pdf" : "note",
    sourceKind: row.kind,
    storagePath: row.storage_path ?? undefined,
    contentText: row.content_text ?? undefined,
    detail,
    addedLabel: new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(row.created_at)),
    status: row.status,
    indexStatus: row.index_status,
    indexError: row.index_error ?? undefined,
  };
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Load material records from one notebook owned by the current user. */
export async function listMaterials(notebookId: string) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase.from("materials")
    .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at")
    .eq("notebook_id", notebookId).eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load materials.");
  return (data as MaterialRow[]).map(toMaterial);
}
