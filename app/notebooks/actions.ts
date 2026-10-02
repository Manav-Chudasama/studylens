"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { notebookDetailsSchema, notebookIdSchema } from "@/lib/notebook-schema";

type NotebookDetails = { title: string; description: string };
export type NotebookActionResult = { ok: true; id?: string } | { ok: false; message: string };

/** Create a notebook for the verified current user. */
export async function createNotebook(input: NotebookDetails): Promise<NotebookActionResult> {
  const parsed = notebookDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check notebook details." };
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase.from("notebooks")
    .insert({ ...parsed.data, owner_id: userId })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: "Could not create notebook." };
  revalidatePath("/");
  return { ok: true, id: data.id };
}

/** Update only a notebook owned by the verified user. */
export async function updateNotebook(id: string, input: NotebookDetails): Promise<NotebookActionResult> {
  if (!notebookIdSchema.safeParse(id).success) return { ok: false, message: "Invalid notebook." };
  const parsed = notebookDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check notebook details." };
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase.from("notebooks")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", userId).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Could not update notebook." };
  revalidatePath("/");
  revalidatePath(`/notebooks/${id}`);
  return { ok: true };
}

/** Delete only a notebook owned by the verified user. */
export async function deleteNotebook(id: string): Promise<NotebookActionResult> {
  if (!notebookIdSchema.safeParse(id).success) return { ok: false, message: "Invalid notebook." };
  const { supabase, userId } = await requireUser();
  const { data: materials, error: listError } = await supabase.from("materials")
    .select("storage_path").eq("notebook_id", id).eq("owner_id", userId);
  if (listError) return { ok: false, message: "Could not inspect notebook files." };
  const paths = (materials ?? []).flatMap((material) => material.storage_path ? [material.storage_path] : []);
  for (let start = 0; start < paths.length; start += 1000) {
    const { error } = await supabase.storage.from("study-materials").remove(paths.slice(start, start + 1000));
    if (error) return { ok: false, message: "Could not remove notebook files." };
  }
  const { data, error } = await supabase.from("notebooks")
    .delete().eq("id", id).eq("owner_id", userId).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Could not delete notebook." };
  revalidatePath("/");
  return { ok: true };
}
