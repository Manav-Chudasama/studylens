"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { notebookIdSchema } from "@/lib/notebook-schema";
import type { RetrievedPassage } from "@/lib/grounded-answer";
import {
  generateStudyGuideFromPassages,
  generateFAQFromPassages,
  generateCheatSheetFromPassages,
  generateAudioOverviewFromPassages,
  type PodcastScript,
} from "@/lib/studio-generator";

type StudioResult =
  | { ok: true; kind: "markdown"; title: string; content: string }
  | { ok: true; kind: "podcast"; script: PodcastScript }
  | { ok: false; message: string };

type ChunkRow = {
  id: string;
  material_id: string;
  page_number: number | null;
  content: string;
  materials: { title: string } | null;
};

export async function generateNotebookStudio(
  notebookId: string,
  type: "guide" | "faq" | "cheatsheet" | "podcast"
): Promise<StudioResult> {
  if (!notebookIdSchema.safeParse(notebookId).success) {
    return { ok: false, message: "Invalid notebook ID." };
  }

  const { supabase, userId } = await requireUser();

  // Verify notebook ownership
  const { data: notebook } = await supabase
    .from("notebooks")
    .select("id, title")
    .eq("id", notebookId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!notebook) {
    return { ok: false, message: "Notebook not found." };
  }

  // Fetch up to 16 key passages across indexed materials for this notebook
  const { data: rawChunks, error: chunkError } = await supabase
    .from("material_chunks")
    .select("id, material_id, page_number, content, materials(title)")
    .eq("notebook_id", notebookId)
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(16);

  if (chunkError || !rawChunks || rawChunks.length === 0) {
    return {
      ok: false,
      message: "No indexed materials found in this notebook. Please upload and index notes or PDFs first.",
    };
  }

  const passages: RetrievedPassage[] = (rawChunks as unknown as ChunkRow[]).map((c) => ({
    chunk_id: c.id,
    material_id: c.material_id,
    material_title: c.materials?.title ?? "Study Material",
    page_number: c.page_number,
    content: c.content,
  }));

  try {
    if (type === "guide") {
      const content = await generateStudyGuideFromPassages(notebook.title, passages);
      return { ok: true, kind: "markdown", title: `Study Guide: ${notebook.title}`, content };
    }

    if (type === "faq") {
      const content = await generateFAQFromPassages(notebook.title, passages);
      return { ok: true, kind: "markdown", title: `FAQ: ${notebook.title}`, content };
    }

    if (type === "cheatsheet") {
      const content = await generateCheatSheetFromPassages(notebook.title, passages);
      return { ok: true, kind: "markdown", title: `Cheat Sheet: ${notebook.title}`, content };
    }

    if (type === "podcast") {
      const script = await generateAudioOverviewFromPassages(notebook.title, passages);
      return { ok: true, kind: "podcast", script };
    }

    return { ok: false, message: "Unknown studio generation type." };
  } catch (error) {
    console.error("Studio generation failed:", error);
    return {
      ok: false,
      message: "Could not synthesize study materials. Please check your AI API key configuration and try again.",
    };
  }
}
