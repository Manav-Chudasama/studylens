"use client";

import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { StudyWorkspace } from "@/components/study-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { previewViewer, sampleNotebookContent, sampleNotebooks } from "@/lib/notebook-fixtures";
import { useNotebookHydration, useNotebookStore } from "@/lib/use-notebook-store";

/** Opens one notebook with only that notebook's materials and conversations. */
export function NotebookWorkspace({ notebookId }: { notebookId: string }) {
  const hasHydrated = useNotebookHydration();
  const createdNotebook = useNotebookStore((state) => state.createdNotebooks.find((notebook) => notebook.id === notebookId));
  const notebook = sampleNotebooks.find((item) => item.id === notebookId) ?? createdNotebook;

  if (!notebook) {
    if (!hasHydrated) return <div aria-live="polite" className="min-h-svh bg-background p-8 text-sm text-muted-foreground">Opening notebook...</div>;

    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-5">
        <Card className="w-full max-w-md border border-border text-center shadow-none ring-0">
          <CardContent className="space-y-4 py-8">
            <BookOpenText aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
            <div>
              <h1 className="font-heading text-xl font-semibold">Notebook not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">This notebook is not in your study space.</p>
            </div>
            <Button nativeButton={false} render={<Link href="/dashboard" />}>Back to notebooks</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const content = sampleNotebookContent[notebook.id];

  return (
    <StudyWorkspace
      conversations={content?.conversations ?? []}
      initialConversationId={content?.conversations[0]?.id}
      key={notebook.id}
      materials={content?.materials ?? []}
      messages={content?.conversations[0]?.messages ?? []}
      notebookTitle={notebook.title}
      previews={content?.previews ?? {}}
      quiz={content?.quiz ?? null}
      viewer={previewViewer}
    />
  );
}
