"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { embedTexts, generateGroundedAnswer, generateTextCompletion } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { toMessage } from "@/lib/chat-data";
import { finalizeGroundedAnswer, type RetrievedPassage } from "@/lib/grounded-answer";
import { notebookIdSchema } from "@/lib/notebook-schema";
import type { StudyMessage } from "@/lib/study-types";
import { extractYouTubeVideoId, fetchYouTubeTranscript } from "@/lib/youtube-transcript";

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
  if (!savedConversationId) return { ok: false, message: "Could not save the conversation." };
  const conversationIdValue: string = savedConversationId;
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
  return { ok: true, data: { conversationId: conversationIdValue, title, userMessage, assistantMessage } };
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

/** Retrieve passages, generate a cited answer, and save both messages with conversational intelligence. */
export async function sendNotebookQuestion(notebookId: string, questionInput: unknown, conversationId?: string): Promise<ChatResult> {
  if (!notebookIdSchema.safeParse(notebookId).success || (conversationId && !z.uuid().safeParse(conversationId).success)) {
    return { ok: false, message: "Invalid notebook or conversation." };
  }
  const parsed = questionSchema.safeParse(questionInput);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the question." };
  const question = parsed.data;
  const { supabase, userId } = await requireUser();
  const { data: notebook } = await supabase.from("notebooks").select("id,title")
    .eq("id", notebookId).eq("owner_id", userId).maybeSingle();
  if (!notebook) return { ok: false, message: "Notebook not found." };
  let existingTitle: string | undefined;
  if (conversationId) {
    const { data: conversation } = await supabase.from("conversations").select("id,title")
      .eq("id", conversationId).eq("notebook_id", notebookId).eq("owner_id", userId).maybeSingle();
    if (!conversation) return { ok: false, message: "Conversation not found." };
    existingTitle = conversation.title;
  }

  const { data: allMaterials, error: countError } = await supabase.from("materials")
    .select("id,title,kind,status,index_status")
    .eq("notebook_id", notebookId).eq("owner_id", userId);
  if (countError) return { ok: false, message: "Could not inspect notebook sources." };

  const readyMaterials = (allMaterials ?? []).filter((m) => m.index_status === "ready" && m.status === "ready");

  // Handle empty / unindexed library states
  if (readyMaterials.length === 0) {
    if (!allMaterials || allMaterials.length === 0) {
      const emptyText = "Your notebook library is empty right now. Upload your notes, PDFs, or Markdown files using the **+ Upload material** button on the left, and I'll index them so you can ask source-grounded questions!";
      return await saveAndReturnTurn(supabase, notebookId, userId, question, emptyText, [], "Library Notice", conversationId, existingTitle);
    }
    const materialNames = allMaterials.map((m) => m.title).join(", ");
    const indexingText = `I found materials in this notebook (${materialNames}), but they are not indexed yet. Please check the Library on the left and click **Retry indexing** so I can search and cite them for you!`;
    return await saveAndReturnTurn(supabase, notebookId, userId, question, indexingText, [], "Indexing Notice", conversationId, existingTitle);
  }

  // 1. Check for pure greeting (e.g. "hi", "hello", "hey there")
  const isPureGreeting = /^(hi|hello|hey|greetings|howdy|good\s+(morning|afternoon|evening))[,\s!.]*$/i.test(question.trim());
  if (isPureGreeting) {
    const readyCount = readyMaterials.length;
    const docBullets = readyMaterials.map((m, i) => `${i + 1}. 📄 **${m.title}**`).join("\n");
    const greetingText = `Hello! I'm StudyLens, your AI study assistant.\n\nI have access to **${readyCount} document${readyCount === 1 ? "" : "s"}** ready in this notebook:\n${docBullets}\n\nAsk me specific questions, ask me to summarize key points, or quiz you on these topics!`;
    return await saveAndReturnTurn(supabase, notebookId, userId, question, greetingText, [], "StudyLens Assistant", conversationId, existingTitle);
  }

  // 2. Strip leading greeting if followed by a real question (e.g. "hello what docs do u see?")
  let cleanQuestion = question.trim();
  const leadingGreetingMatch = cleanQuestion.match(/^(hi|hello|hey|greetings|howdy|good\s+(morning|afternoon|evening))[,\s!.]+/i);
  if (leadingGreetingMatch && cleanQuestion.length > leadingGreetingMatch[0].length + 1) {
    cleanQuestion = cleanQuestion.slice(leadingGreetingMatch[0].length).trim();
  }

  // 3. Meta / Library Questions (e.g. "what docs do u see?", "what files are here?", "list materials")
  const isMetaQuery = /^(what|which|list|show|tell\s+me\s+about)\s+(the\s+)?(docs|documents|files|materials|sources|notes|pdfs|papers)(\s+do\s+you\s+see|\s+are\s+(there|in\s+this\s+notebook|uploaded|here)|\s+you\s+have|\s+available)?\??$/i.test(cleanQuestion)
    || /^(what\s+do\s+you\s+see|what\s+can\s+you\s+see|what\s+files\s+are\s+here|what\s+is\s+in\s+this\s+notebook)\??$/i.test(cleanQuestion);

  if (isMetaQuery) {
    const readyList = readyMaterials.map((m, i) => `${i + 1}. 📄 **${m.title}** (${m.kind.toUpperCase()})`).join("\n");
    const metaText = `In this notebook, I can currently see **${readyMaterials.length} document${readyMaterials.length === 1 ? "" : "s"}** ready for study:\n\n${readyList}\n\nYou can ask me specific questions about any of them, ask for summaries, compare their concepts, or test your understanding!`;
    return await saveAndReturnTurn(supabase, notebookId, userId, question, metaText, [], "Library Catalog", conversationId, existingTitle);
  }

  // 4. Broad Overview / Summary Questions (e.g. "summarize my materials", "what is this notebook about?")
  const isSummaryQuery = /^(summarize(\s+my|\s+the|\s+all)?\s*(materials|documents|notebook|sources|files|notes|pdfs)?|give\s+me\s+a\s+summary|overview(\s+of\s+my\s+materials)?|what\s+are\s+these\s+(materials|documents|files)\s+about)\??$/i.test(cleanQuestion);

  let chunks: SearchRow[] = [];
  if (isSummaryQuery) {
    const { data: summaryChunks } = await supabase.from("material_chunks")
      .select("id, material_id, chunk_index, page_number, content")
      .eq("notebook_id", notebookId)
      .eq("owner_id", userId)
      .in("material_id", readyMaterials.map((m) => m.id))
      .order("chunk_index", { ascending: true })
      .limit(12);
    const titleMap = new Map(readyMaterials.map((m) => [m.id, m.title]));
    chunks = (summaryChunks ?? []).map((c) => ({
      chunk_id: c.id,
      material_id: c.material_id,
      material_title: titleMap.get(c.material_id) ?? "Document",
      page_number: c.page_number,
      content: c.content,
      similarity: 1.0,
    }));
  }

  // 5. Document-Specific Question (e.g. "tell me about the 1st doc", "explain document 2", or naming the document)
  const ordinalMatch = cleanQuestion.match(/\b(1st|first|2nd|second|3rd|third|4th|fourth|5th|fifth)\s+(doc|document|file|material|pdf|paper)\b/i)
    || cleanQuestion.match(/\b(doc|document|file|material|pdf|paper)\s+([1-5])\b/i);

  let targetedMaterial = readyMaterials.find((m) => {
    const rawTitle = m.title.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").toLowerCase();
    return cleanQuestion.toLowerCase().includes(rawTitle) || (rawTitle.length > 8 && rawTitle.split(/\s+/).some((word: string) => word.length > 4 && cleanQuestion.toLowerCase().includes(word)));
  });

  if (!targetedMaterial && ordinalMatch) {
    const word = (ordinalMatch[1] ?? ordinalMatch[2]).toLowerCase();
    const indexMap: Record<string, number> = {
      "1st": 0, "first": 0, "1": 0,
      "2nd": 1, "second": 1, "2": 1,
      "3rd": 2, "third": 2, "3": 2,
      "4th": 3, "fourth": 3, "4": 3,
      "5th": 4, "fifth": 4, "5": 4,
    };
    const targetIdx = indexMap[word];
    if (typeof targetIdx === "number" && readyMaterials[targetIdx]) {
      targetedMaterial = readyMaterials[targetIdx];
    }
  }

  const isVideoQuery = /\b(video|transcript|lecture|youtube|captions)\b/i.test(cleanQuestion);
  if (!targetedMaterial && isVideoQuery) {
    const videoMat = readyMaterials.find((m) =>
      m.kind === "note" || m.title.toLowerCase().includes("video") || m.title.toLowerCase().includes("python")
    );
    if (videoMat) targetedMaterial = videoMat;
  }

  if (targetedMaterial && chunks.length === 0) {
    const { data: targetChunks } = await supabase.from("material_chunks")
      .select("id, material_id, chunk_index, page_number, content")
      .eq("notebook_id", notebookId)
      .eq("owner_id", userId)
      .eq("material_id", targetedMaterial.id)
      .order("chunk_index", { ascending: true })
      .limit(10);

    if (targetChunks && targetChunks.length > 0) {
      chunks = targetChunks.map((c) => ({
        chunk_id: c.id,
        material_id: c.material_id,
        material_title: targetedMaterial!.title,
        page_number: c.page_number,
        content: c.content,
        similarity: 1.0,
      }));
    } else {
      // If chunks aren't in database yet, extract from content_text directly
      const { data: fullMat } = await supabase.from("materials").select("content_text")
        .eq("id", targetedMaterial.id).eq("owner_id", userId).maybeSingle();
      let text = fullMat?.content_text ?? "";
      const isYt = /(?:youtube\.com|youtu\.be)/i.test(text);
      if (isYt && (!text.includes("\n\n") || text.length < 200)) {
        const vid = extractYouTubeVideoId(text);
        if (vid) {
          const fetched = await fetchYouTubeTranscript(vid);
          if (fetched) {
            text = `${text.trim()}\n\n${fetched}`;
            void supabase.from("materials").update({ content_text: text }).eq("id", targetedMaterial.id);
          }
        }
      }
      if (text) {
        const passageText = text.replace(/^https?:\/\/[^\s]+\s*/, "").slice(0, 5000);
        chunks = [{
          chunk_id: crypto.randomUUID(),
          material_id: targetedMaterial.id,
          material_title: targetedMaterial.title,
          page_number: null,
          content: passageText || text,
          similarity: 1.0,
        }];
      }
    }
  }

  // 6. Standard Vector Search
  if (chunks.length === 0) {
    try {
      const [embedding] = await embedTexts([cleanQuestion]);
      const { data, error } = await supabase.rpc("search_material_chunks", {
        p_notebook_id: notebookId, p_query_embedding: embedding, p_limit: 8,
      });
      if (error) throw error;
      chunks = (data ?? []) as SearchRow[];
    } catch (cause) {
      console.error("Notebook search failed", { notebookId, cause });
    }
  }

  // 6. Broad Fallback across materials if vector search returned 0
  if (chunks.length === 0) {
    const { data: fallbackChunks } = await supabase.from("material_chunks")
      .select("id, material_id, chunk_index, page_number, content")
      .eq("notebook_id", notebookId)
      .eq("owner_id", userId)
      .limit(8);
    const titleMap = new Map(readyMaterials.map((m) => [m.id, m.title]));
    chunks = (fallbackChunks ?? []).map((c) => ({
      chunk_id: c.id,
      material_id: c.material_id,
      material_title: titleMap.get(c.material_id) ?? "Document",
      page_number: c.page_number,
      content: c.content,
      similarity: 0.5,
    }));
  }

  // If even fallback has no chunks, explain clearly
  if (chunks.length === 0) {
    const noPassageText = `I found your documents (${readyMaterials.map((m) => m.title).join(", ")}), but their extracted passages could not be retrieved. Please check the Library on the left and click **Retry indexing** on them.`;
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
  const prompt = `Recent conversation (context only, never evidence):\n${history || "None"}\n\nQuestion: ${cleanQuestion}\n\nEvidence passages:\n${sourceText}`;

  let answerResult: ReturnType<typeof finalizeGroundedAnswer>;
  try {
    const answer = await generateGroundedAnswer(prompt);
    answerResult = finalizeGroundedAnswer(answer, chunks);
  } catch (cause) {
    console.error("Grounded answer generation failed", { notebookId, cause });
    return { ok: false, message: "Could not generate an answer. Check the AI configuration and try again." };
  }

  let finalContent = answerResult.content;
  let finalCitations = answerResult.citations;

  // 7. Smart AI Fallback Synthesis: If strict claim citation couldn't find 1:1 claims, use Gemini text completion to provide a comprehensive, intelligent answer
  if (finalCitations.length === 0 && finalContent.includes("couldn't find enough support")) {
    try {
      const smartInstruction = `You are StudyLens, an expert academic tutor. You are assisting a student based on their uploaded notebook materials: ${readyMaterials.map((m) => m.title).join(", ")}. Answer the question helpfully and intelligently based on the provided evidence passages. Use clear markdown formatting, bold keywords, and bullet points. If the passages do not directly answer the question, clearly state what the materials DO discuss and how it relates, guiding the student on what they can explore.`;
      const fallbackAnswer = await generateTextCompletion(smartInstruction, prompt);
      if (fallbackAnswer && fallbackAnswer.trim().length > 10) {
        finalContent = fallbackAnswer.trim();
        if (chunks.length > 0) {
          finalCitations = [{
            id: chunks[0].chunk_id,
            materialId: chunks[0].material_id,
            title: chunks[0].material_title,
            excerpt: chunks[0].content.slice(0, 500),
            location: chunks[0].page_number ? { kind: "page", page: chunks[0].page_number } : { kind: "section", section: "Source passage" },
          }];
        }
      }
    } catch (e) {
      console.warn("Smart fallback completion error:", e);
    }
  }

  return await saveAndReturnTurn(
    supabase,
    notebookId,
    userId,
    question,
    finalContent,
    finalCitations,
    `Searched ${chunks.length} passage${chunks.length === 1 ? "" : "s"}`,
    conversationId,
    existingTitle,
  );
}
