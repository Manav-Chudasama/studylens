"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { embedTexts, generateGroundedAnswer } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { toMessage } from "@/lib/chat-data";
import { finalizeGroundedAnswer, type RetrievedPassage } from "@/lib/grounded-answer";
import { notebookIdSchema } from "@/lib/notebook-schema";
import type { StudyMessage } from "@/lib/study-types";

const questionSchema = z.string().trim().min(3, "Ask a complete question.").max(2000, "Keep questions under 2,000 characters.");

type ChatTurn = { conversationId: string; title: string; userMessage: StudyMessage; assistantMessage: StudyMessage };
type ChatResult = { ok: true; data: ChatTurn } | { ok: false; message: string };

type SearchRow = RetrievedPassage & { similarity: number };

/** Load one owned conversation when selected from history. */
export async function loadConversation(notebookId: string, conversationId: string): Promise<{ ok: true; messages: StudyMessage[] } | { ok: false; message: string }> {
  if (!notebookIdSchema.safeParse(notebookId).success || !z.uuid().safeParse(conversationId).success) {
    return { ok: false, message: "Invalid conversation." };
  }
  const { supabase, userId } = await requireUser();
  const { data: conversation } = await supabase.from("conversations").select("id")
    .eq("id", conversationId).eq("notebook_id", notebookId).eq("owner_id", userId).maybeSingle();
  if (!conversation) return { ok: false, message: "Conversation not found." };
  const { data, error } = await supabase.from("chat_messages").select("id,role,content,citations")
    .eq("conversation_id", conversationId).eq("notebook_id", notebookId).eq("owner_id", userId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, message: "Could not load conversation." };
  return { ok: true, messages: (data ?? []).map((row) => toMessage(row as Parameters<typeof toMessage>[0])) };
}

/** Retrieve passages, generate a cited answer, and save both messages. */
export async function sendNotebookQuestion(notebookId: string, questionInput: unknown, conversationId?: string): Promise<ChatResult> {
  if (!notebookIdSchema.safeParse(notebookId).success || (conversationId && !z.uuid().safeParse(conversationId).success)) {
    return { ok: false, message: "Invalid notebook or conversation." };
  }
  const parsed = questionSchema.safeParse(questionInput);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the question." };
  const question = parsed.data;
  const { supabase, userId } = await requireUser();
  const { data: notebook } = await supabase.from("notebooks").select("id")
    .eq("id", notebookId).eq("owner_id", userId).maybeSingle();
  if (!notebook) return { ok: false, message: "Notebook not found." };
  let existingTitle: string | undefined;
  if (conversationId) {
    const { data: conversation } = await supabase.from("conversations").select("id,title")
      .eq("id", conversationId).eq("notebook_id", notebookId).eq("owner_id", userId).maybeSingle();
    if (!conversation) return { ok: false, message: "Conversation not found." };
    existingTitle = conversation.title;
  }
  const { count, error: countError } = await supabase.from("materials").select("id", { count: "exact", head: true })
    .eq("notebook_id", notebookId).eq("owner_id", userId).eq("index_status", "ready").eq("status", "ready");
  if (countError) return { ok: false, message: "Could not inspect notebook sources." };
  if (!count) return { ok: false, message: "Index a material in this notebook before asking questions." };

  let chunks: SearchRow[];
  try {
    const [embedding] = await embedTexts([question]);
    const { data, error } = await supabase.rpc("search_material_chunks", {
      p_notebook_id: notebookId, p_query_embedding: embedding, p_limit: 8,
    });
    if (error) throw error;
    chunks = (data ?? []) as SearchRow[];
  } catch (cause) {
    console.error("Notebook search failed", { notebookId, cause });
    return { ok: false, message: "Could not search your materials. Check the AI configuration and try again." };
  }
  if (chunks.length === 0) return { ok: false, message: "No searchable passages were found in this notebook." };

  let history = "";
  if (conversationId) {
    const { data } = await supabase.from("chat_messages").select("role,content")
      .eq("conversation_id", conversationId).eq("notebook_id", notebookId).eq("owner_id", userId)
      .order("created_at", { ascending: false }).limit(8);
    history = (data ?? []).reverse().map((item) => `${item.role}: ${item.content.slice(0, 1000)}`).join("\n");
  }
  const sourceText = chunks.map((chunk) =>
    `SOURCE ID ${chunk.chunk_id}\nTITLE ${chunk.material_title}\n${chunk.page_number ? `PAGE ${chunk.page_number}\n` : ""}TEXT ${chunk.content}`,
  ).join("\n\n---\n\n");
  const prompt = `Recent conversation (context only, never evidence):\n${history || "None"}\n\nQuestion: ${question}\n\nEvidence passages:\n${sourceText}`;

  let answerResult: ReturnType<typeof finalizeGroundedAnswer>;
  try {
    const answer = await generateGroundedAnswer(prompt);
    answerResult = finalizeGroundedAnswer(answer, chunks);
  } catch (cause) {
    console.error("Grounded answer generation failed", { notebookId, cause });
    return { ok: false, message: "Could not generate an answer. Check the AI configuration and try again." };
  }

  const title = existingTitle ?? question.slice(0, 120);
  let savedConversationId = conversationId;
  let isNewConversation = false;
  if (!savedConversationId) {
    const { data, error } = await supabase.from("conversations").insert({ notebook_id: notebookId, owner_id: userId, title })
      .select("id").single();
    if (error || !data) return { ok: false, message: "Could not save the conversation." };
    savedConversationId = data.id;
    isNewConversation = true;
  }
  if (!savedConversationId) return { ok: false, message: "Could not save the conversation." };
  const now = Date.now();
  const userMessage: StudyMessage = { id: crypto.randomUUID(), role: "user", content: question, citations: [] };
  const assistantMessage: StudyMessage = { id: crypto.randomUUID(), role: "assistant", content: answerResult.content, citations: answerResult.citations,
    activity: `Searched ${chunks.length} passage${chunks.length === 1 ? "" : "s"}` };
  const { error: saveError } = await supabase.from("chat_messages").insert([
    { id: userMessage.id, conversation_id: savedConversationId, notebook_id: notebookId, owner_id: userId,
      role: "user", content: question, citations: [], created_at: new Date(now).toISOString() },
    { id: assistantMessage.id, conversation_id: savedConversationId, notebook_id: notebookId, owner_id: userId,
      role: "assistant", content: answerResult.content, citations: answerResult.citations, created_at: new Date(now + 1).toISOString() },
  ]);
  if (saveError) {
    if (isNewConversation) await supabase.from("conversations").delete().eq("id", savedConversationId).eq("owner_id", userId);
    return { ok: false, message: "Could not save the answer." };
  }
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() })
    .eq("id", savedConversationId).eq("notebook_id", notebookId).eq("owner_id", userId);
  revalidatePath(`/notebooks/${notebookId}`);
  return { ok: true, data: { conversationId: savedConversationId, title, userMessage, assistantMessage } };
}
