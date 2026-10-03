"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { embedTexts, generateGroundedAnswer } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { toMessage } from "@/lib/chat-data";
import { finalizeGroundedAnswer, type RetrievedPassage } from "@/lib/grounded-answer";
import { notebookIdSchema } from "@/lib/notebook-schema";
import type { StudyMessage } from "@/lib/study-types";

const questionSchema = z.string().trim().min(1, "Enter a question.").max(2000, "Keep questions under 2,000 characters.");

type ChatTurn = { conversationId: string; title: string; userMessage: StudyMessage; assistantMessage: StudyMessage };
type ChatResult = { ok: true; data: ChatTurn } | { ok: false; message: string };

type SearchRow = RetrievedPassage & { similarity: number };

async function saveAndReturnTurn(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  notebookId: string,
  userId: string,
  question: string,
  assistantContent: string,
  citations: StudyMessage["citations"],
  activity: string,
  conversationId?: string,
  existingTitle?: string,
): Promise<ChatResult> {
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
  const now = Date.now();
  const userMessage: StudyMessage = { id: crypto.randomUUID(), role: "user", content: question, citations: [] };
  const assistantMessage: StudyMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: assistantContent,
    citations,
    activity,
  };
  const { error: saveError } = await supabase.from("chat_messages").insert([
    {
      id: userMessage.id,
      conversation_id: savedConversationId,
      notebook_id: notebookId,
      owner_id: userId,
      role: "user",
      content: question,
      citations: [],
      created_at: new Date(now).toISOString(),
    },
    {
      id: assistantMessage.id,
      conversation_id: savedConversationId,
      notebook_id: notebookId,
      owner_id: userId,
      role: "assistant",
      content: assistantContent,
      citations,
      created_at: new Date(now + 1).toISOString(),
    },
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

  // Handle conversational greetings smoothly without throwing an error
  const isGreeting = /^(hi|hello|hey|greetings|howdy|good\s+(morning|afternoon|evening))\b/i.test(question);
  if (isGreeting) {
    const greetingText = "Hello! I'm StudyLens, your AI study assistant. Ask me questions about your uploaded materials, or ask me to summarize key points, generate a study guide, or quiz you!";
    return await saveAndReturnTurn(supabase, notebookId, userId, question, greetingText, [], "StudyLens Assistant", conversationId, existingTitle);
  }

  const { data: allMaterials, error: countError } = await supabase.from("materials")
    .select("id,title,status,index_status")
    .eq("notebook_id", notebookId).eq("owner_id", userId);
  if (countError) return { ok: false, message: "Could not inspect notebook sources." };

  const readyMaterials = (allMaterials ?? []).filter((m) => m.index_status === "ready" && m.status === "ready");
  if (readyMaterials.length === 0) {
    if (!allMaterials || allMaterials.length === 0) {
      const emptyText = "Your notebook library is empty right now. Upload your notes, PDFs, or Markdown files using the **+ Upload material** button on the left, and I'll index them so you can ask source-grounded questions!";
      return await saveAndReturnTurn(supabase, notebookId, userId, question, emptyText, [], "Library Notice", conversationId, existingTitle);
    }
    const materialNames = allMaterials.map((m) => m.title).join(", ");
    const indexingText = `I found materials in this notebook (${materialNames}), but they are not indexed yet. Please check the Library on the left and click **Retry indexing** so I can search and cite them for you!`;
    return await saveAndReturnTurn(supabase, notebookId, userId, question, indexingText, [], "Indexing Notice", conversationId, existingTitle);
  }

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

  if (chunks.length === 0) {
    const noPassageText = `I searched your indexed materials, but couldn't find any relevant passages for "${question}". Try rephrasing your question or checking if the topic is covered in your uploaded files.`;
    return await saveAndReturnTurn(supabase, notebookId, userId, question, noPassageText, [], `Searched ${readyMaterials.length} material(s)`, conversationId, existingTitle);
  }

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

  return await saveAndReturnTurn(
    supabase,
    notebookId,
    userId,
    question,
    answerResult.content,
    answerResult.citations,
    `Searched ${chunks.length} passage${chunks.length === 1 ? "" : "s"}`,
    conversationId,
    existingTitle,
  );
}
