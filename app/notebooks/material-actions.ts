"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { extractYouTubeVideoId, fetchYouTubeTitle, fetchYouTubeTranscript } from "@/lib/youtube-transcript";

import { requireUser } from "@/lib/auth";
import { fileKind, fileMaterialSchema, fileMime, noteMaterialSchema } from "@/lib/material-schema";
import { toMaterial, type MaterialRow } from "@/lib/materials";
import { notebookIdSchema } from "@/lib/notebook-schema";
import type { Material } from "@/lib/study-types";

const bucket = "study-materials";
type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; message: string };

async function ownedNotebook(notebookId: string) {
  if (!notebookIdSchema.safeParse(notebookId).success) return null;
  const context = await requireUser();
  const { data } = await context.supabase.from("notebooks").select("id")
    .eq("id", notebookId).eq("owner_id", context.userId).maybeSingle();
  return data ? context : null;
}

function refreshNotebook(id: string) {
  revalidatePath(`/notebooks/${id}`);
  revalidatePath("/");
}

/** Persist a pasted note after verifying the notebook owner. */
export async function createNoteMaterial(notebookId: string, input: unknown): Promise<ActionResult<Material>> {
  const parsed = noteMaterialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the note." };
  const context = await ownedNotebook(notebookId);
  if (!context) return { ok: false, message: "Notebook not found." };
  const { data, error } = await context.supabase.from("materials")
    .insert({ notebook_id: notebookId, owner_id: context.userId, kind: "note", title: parsed.data.title,
      content_text: parsed.data.content, status: "ready" })
    .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at").single();
  if (error || !data) return { ok: false, message: "Could not save the note." };
  await context.supabase.from("notebooks").update({ updated_at: new Date().toISOString() })
    .eq("id", notebookId).eq("owner_id", context.userId);
  refreshNotebook(notebookId);
  return { ok: true, data: toMaterial(data as MaterialRow) };
}


/** Persist a video URL after verifying the notebook owner. */
export async function createVideoMaterial(notebookId: string, url: string): Promise<ActionResult<Material>> {
  const context = await ownedNotebook(notebookId);
  if (!context) return { ok: false, message: "Notebook not found." };
  
  const videoId = extractYouTubeVideoId(url);
  const fetchedTitle = await fetchYouTubeTitle(url);
  const title = fetchedTitle || "YouTube Video";
  
  let transcriptText = "";
  if (videoId) {
    transcriptText = await fetchYouTubeTranscript(videoId);
  }

  const fullContentText = transcriptText ? `${url}\n\n${transcriptText}` : url;

  const { data, error } = await context.supabase.from("materials")
    .insert({
      notebook_id: notebookId,
      owner_id: context.userId,
      kind: "note",
      title,
      content_text: fullContentText,
      status: "ready",
    })
    .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at")
    .single();

  if (error || !data) return { ok: false, message: "Could not save the video." };
  await context.supabase.from("notebooks").update({ updated_at: new Date().toISOString() })
    .eq("id", notebookId).eq("owner_id", context.userId);
  refreshNotebook(notebookId);
  return { ok: true, data: toMaterial(data as MaterialRow) };
}

/** Reserve a private storage path bound to this user's notebook and material row. */
export async function reserveFileMaterial(notebookId: string, input: unknown): Promise<ActionResult<{ id: string; path: string; mime: string }>> {
  const parsed = fileMaterialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a PDF, TXT, or Markdown file under 20 MB." };
  const kind = fileKind(parsed.data.name);
  if (!kind) return { ok: false, message: "Only PDF, TXT, and Markdown files are supported." };
  const context = await ownedNotebook(notebookId);
  if (!context) return { ok: false, message: "Notebook not found." };
  const id = crypto.randomUUID();
  const path = `${context.userId}/${notebookId}/${id}.${kind}`;
  const mime = fileMime(kind);
  const { error } = await context.supabase.from("materials").insert({
    id, notebook_id: notebookId, owner_id: context.userId, kind,
    title: parsed.data.name, original_filename: parsed.data.name, storage_path: path,
    mime_type: mime, byte_size: parsed.data.size, status: "processing",
  });
  if (error) return { ok: false, message: "Could not prepare the upload." };
  refreshNotebook(notebookId);
  return { ok: true, data: { id, path, mime } };
}

/** Mark an upload ready only after its private storage object exists with the expected size. */
export async function completeFileMaterial(notebookId: string, materialId: string): Promise<ActionResult<Material>> {
  if (!z.uuid().safeParse(materialId).success) return { ok: false, message: "Invalid material." };
  const context = await ownedNotebook(notebookId);
  if (!context) return { ok: false, message: "Notebook not found." };
  const { data: row } = await context.supabase.from("materials")
    .select("id,storage_path,byte_size,status")
    .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", context.userId).maybeSingle();
  if (!row?.storage_path) return { ok: false, message: "Material not found." };
  const { data: object, error: storageError } = await context.supabase.storage.from(bucket).info(row.storage_path);
  if (storageError || !object || Number(object.size) !== row.byte_size) {
    return { ok: false, message: "Upload is incomplete or its size does not match." };
  }
  const { data, error } = await context.supabase.from("materials")
    .update({ status: "ready" }).eq("id", materialId).eq("notebook_id", notebookId)
    .eq("owner_id", context.userId)
    .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at").single();
  if (error || !data) return { ok: false, message: "Could not finish the upload." };
  await context.supabase.from("notebooks").update({ updated_at: new Date().toISOString() })
    .eq("id", notebookId).eq("owner_id", context.userId);
  refreshNotebook(notebookId);
  return { ok: true, data: toMaterial(data as MaterialRow) };
}

/** Surface an interrupted upload in the library so it can be removed. */
export async function failFileMaterial(notebookId: string, materialId: string): Promise<ActionResult<Material>> {
  if (!z.uuid().safeParse(materialId).success) return { ok: false, message: "Invalid material." };
  const context = await ownedNotebook(notebookId);
  if (!context) return { ok: false, message: "Notebook not found." };
  const { data, error } = await context.supabase.from("materials")
    .update({ status: "failed" }).eq("id", materialId).eq("notebook_id", notebookId)
    .eq("owner_id", context.userId).eq("status", "processing")
    .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at").maybeSingle();
  if (error || !data) return { ok: false, message: "Could not mark this upload as failed." };
  refreshNotebook(notebookId);
  return { ok: true, data: toMaterial(data as MaterialRow) };
}

/** Remove a material and its private file, including an incomplete upload. */
export async function deleteMaterial(notebookId: string, materialId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(materialId).success) return { ok: false, message: "Invalid material." };
  const context = await ownedNotebook(notebookId);
  if (!context) return { ok: false, message: "Notebook not found." };
  const { data: row } = await context.supabase.from("materials").select("storage_path")
    .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", context.userId).maybeSingle();
  if (!row) return { ok: false, message: "Material not found." };
  if (row.storage_path) {
    const { error } = await context.supabase.storage.from(bucket).remove([row.storage_path]);
    if (error) return { ok: false, message: "Could not remove the stored file." };
  }
  const { error } = await context.supabase.from("materials").delete()
    .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", context.userId);
  if (error) return { ok: false, message: "Could not remove the material." };
  refreshNotebook(notebookId);
  return { ok: true, data: undefined };
}
