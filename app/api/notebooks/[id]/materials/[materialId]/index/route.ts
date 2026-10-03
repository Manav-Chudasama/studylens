import { revalidatePath } from "next/cache";
import { z } from "zod";

import { embedTexts } from "@/lib/ai";
import { chunkSourcePages, extractSourcePages, IndexingError } from "@/lib/ingestion";
import { toMaterial, type MaterialRow } from "@/lib/materials";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Extract, embed, and store source passages for one owned material. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; materialId: string }> }) {
  const { id: notebookId, materialId } = await params;
  if (!z.uuid().safeParse(notebookId).success || !z.uuid().safeParse(materialId).success) {
    return Response.json({ message: "Invalid material." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: identity, error: authError } = await supabase.auth.getClaims();
  const userId = identity?.claims?.sub;
  if (authError || !userId) return Response.json({ message: "Sign in to index materials." }, { status: 401 });

  const { data: material, error: materialError } = await supabase.from("materials")
    .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at")
    .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", userId).maybeSingle();
  if (materialError || !material) return Response.json({ message: "Material not found." }, { status: 404 });
  if (material.status !== "ready") return Response.json({ message: "Finish uploading this material first." }, { status: 409 });
  if (material.index_status === "indexing") return Response.json({ message: "This material is already indexing." }, { status: 409 });

  const { data: locked, error: lockError } = await supabase.from("materials")
    .update({ index_status: "indexing", index_error: null })
    .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", userId)
    .eq("index_status", material.index_status).select("id").maybeSingle();
  if (lockError || !locked) return Response.json({ message: "Could not start indexing." }, { status: 409 });

  try {
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new IndexingError("Set GEMINI_API_KEY or OPENAI_API_KEY on the server to enable indexing.");
    }
    let file: Blob | undefined;
    if (material.storage_path) {
      const { data, error } = await supabase.storage.from("study-materials").download(material.storage_path);
      if (error || !data) throw new IndexingError("Could not read the stored file.");
      file = data;
    }
    const pages = await extractSourcePages(material as MaterialRow, file);
    const chunks = chunkSourcePages(pages);
    const { error: clearError } = await supabase.from("material_chunks").delete()
      .eq("material_id", materialId).eq("notebook_id", notebookId).eq("owner_id", userId);
    if (clearError) throw new Error("Could not clear prior passages.");

    for (let start = 0; start < chunks.length; start += 24) {
      const batch = chunks.slice(start, start + 24);
      const vectors = await embedTexts(batch.map((chunk) => chunk.content));
      const rows = batch.map((chunk, index) => ({
        material_id: materialId,
        notebook_id: notebookId,
        owner_id: userId,
        chunk_index: chunk.chunkIndex,
        page_number: chunk.pageNumber,
        content: chunk.content,
        embedding: vectors[index],
      }));
      const { error } = await supabase.from("material_chunks").insert(rows);
      if (error) throw new Error("Could not store indexed passages.");
    }

    const { data: ready, error: readyError } = await supabase.from("materials")
      .update({ index_status: "ready", index_error: null, indexed_at: new Date().toISOString() })
      .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", userId)
      .select("id,title,kind,original_filename,storage_path,byte_size,content_text,status,index_status,index_error,created_at").single();
    if (readyError || !ready) throw new Error("Could not finish indexing.");
    revalidatePath(`/notebooks/${notebookId}`);
    return Response.json({ material: toMaterial(ready as MaterialRow), chunkCount: chunks.length });
  } catch (cause) {
    const message = cause instanceof IndexingError ? cause.message : "Indexing failed. Retry this material.";
    console.error("Material indexing failed", { materialId, cause });
    await supabase.from("materials").update({ index_status: "failed", index_error: message })
      .eq("id", materialId).eq("notebook_id", notebookId).eq("owner_id", userId);
    revalidatePath(`/notebooks/${notebookId}`);
    return Response.json({ message }, { status: cause instanceof IndexingError ? 422 : 500 });
  }
}
