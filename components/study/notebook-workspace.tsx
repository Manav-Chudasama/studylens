"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createNoteMaterial, completeFileMaterial, deleteMaterial, failFileMaterial, reserveFileMaterial } from "@/app/notebooks/material-actions";
import { loadConversation, sendNotebookQuestion } from "@/app/notebooks/chat-actions";
import { StudyWorkspace } from "@/components/study-workspace";
import type { ChatSubmission } from "@/components/study/chat-composer";
import type { MaterialUploadRequest } from "@/components/study/material-upload";
import { fileKind, MAX_FILE_BYTES } from "@/lib/material-schema";
import type { Material, StudyConversation, StudyNotebook, StudyUser } from "@/lib/study-types";
import { uploadPrivateFile } from "@/lib/upload-private-file";

/** Connect one authenticated notebook's study UI to persisted materials. */
export function NotebookWorkspace({ notebook, viewer, initialMaterials, initialConversations }: { notebook: StudyNotebook; viewer: StudyUser; initialMaterials: Material[]; initialConversations: StudyConversation[] }) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);
  const [conversations, setConversations] = useState(initialConversations);

  async function indexMaterial(id: string) {
    setMaterials((items) => items.map((item) => item.id === id ? { ...item, indexStatus: "indexing", indexError: undefined } : item));
    try {
      const response = await fetch(`/api/notebooks/${notebook.id}/materials/${id}/index`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Indexing failed.");
      setMaterials((items) => items.map((item) => item.id === id ? result.material as Material : item));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Indexing failed. Retry this material.";
      setMaterials((items) => items.map((item) => item.id === id ? { ...item, indexStatus: "failed", indexError: message } : item));
    }
    router.refresh();
  }

  async function indexMaterials(ids: string[]) {
    for (const id of ids) await indexMaterial(id);
  }

  async function handleUpload(request: MaterialUploadRequest) {
    if (request.kind === "video") throw new Error("YouTube transcripts are not available yet.");
    if (request.kind === "note") {
      const result = await createNoteMaterial(notebook.id, { title: request.title, content: request.content });
      if (!result.ok) throw new Error(result.message);
      setMaterials((items) => [result.data, ...items]);
      router.refresh();
      void indexMaterials([result.data.id]);
      return;
    }
    if (request.files.length > 10) throw new Error("Choose up to 10 files at once.");
    const uploadedIds: string[] = [];
    for (const file of request.files) {
      if (!fileKind(file.name) || file.size < 1 || file.size > MAX_FILE_BYTES) {
        throw new Error(`${file.name}: choose a PDF, TXT, or Markdown file under 20 MB.`);
      }
      const reservation = await reserveFileMaterial(notebook.id, { name: file.name, size: file.size });
      if (!reservation.ok) throw new Error(reservation.message);
      try {
        await uploadPrivateFile(file, reservation.data.path, reservation.data.mime);
        const result = await completeFileMaterial(notebook.id, reservation.data.id);
        if (!result.ok) throw new Error(result.message);
        setMaterials((items) => [result.data, ...items]);
        uploadedIds.push(result.data.id);
      } catch (cause) {
        const failed = await failFileMaterial(notebook.id, reservation.data.id);
        if (failed.ok) setMaterials((items) => [failed.data, ...items]);
        router.refresh();
        throw cause;
      }
    }
    router.refresh();
    void indexMaterials(uploadedIds);
  }

  async function handleDelete(id: string) {
    const result = await deleteMaterial(notebook.id, id);
    if (!result.ok) throw new Error(result.message);
    setMaterials((items) => items.filter((item) => item.id !== id));
    router.refresh();
  }

  async function handleSend(submission: ChatSubmission, conversationId?: string) {
    const result = await sendNotebookQuestion(notebook.id, submission.text, conversationId);
    if (!result.ok) throw new Error(result.message);
    const turn = result.data;
    setConversations((items) => [
      { id: turn.conversationId, title: turn.title, updatedLabel: "Just now", messages: [] },
      ...items.filter((item) => item.id !== turn.conversationId),
    ]);
    router.refresh();
    return turn;
  }

  async function handleSelectConversation(id: string) {
    const result = await loadConversation(notebook.id, id);
    if (!result.ok) throw new Error(result.message);
    return result.messages;
  }

  return (
    <StudyWorkspace
      key={notebook.id}
      notebookId={notebook.id}
      notebookTitle={notebook.title}
      viewer={viewer}
      materials={materials}
      conversations={conversations}
      messages={[]}
      previews={{}}
      quiz={null}
      enableDemoChat={false}
      onUpload={handleUpload}
      onDeleteMaterial={handleDelete}
      onIndexMaterial={indexMaterial}
      onSend={handleSend}
      onSelectConversation={handleSelectConversation}
    />
  );
}
