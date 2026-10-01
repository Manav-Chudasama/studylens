"use client";

import { useState } from "react";
import { BookOpenText, Menu, Sparkles } from "lucide-react";

import { AccountDialog } from "@/components/study/account-dialog";
import { ChatComposer, type ChatSubmission } from "@/components/study/chat-composer";
import { ChatThread, type ChatState } from "@/components/study/chat-thread";
import { MaterialLibrary } from "@/components/study/material-library";
import { MaterialUpload, type MaterialUploadRequest } from "@/components/study/material-upload";
import { SourceViewer } from "@/components/study/source-viewer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  sampleMaterials,
  sampleMessages,
  samplePreviews,
  sampleQuiz,
} from "@/lib/study-fixtures";
import type {
  Citation,
  Material,
  QuizQuestion,
  SourcePreview,
  StudyMessage,
} from "@/lib/study-types";

type StudyWorkspaceProps = {
  materials?: Material[];
  messages?: StudyMessage[];
  previews?: Record<string, SourcePreview>;
  quiz?: QuizQuestion | null;
  chatState?: ChatState;
  onUpload?: (request: MaterialUploadRequest) => Promise<void>;
  onSend?: (submission: ChatSubmission) => Promise<void>;
  onRetry?: () => void;
  onConnectTelegram?: () => Promise<string>;
};

/** Composes the study UI around typed data and optional future backend actions. */
export function StudyWorkspace({
  materials = sampleMaterials,
  messages = sampleMessages,
  previews = samplePreviews,
  quiz = sampleQuiz,
  chatState = "idle",
  onUpload,
  onSend,
  onRetry,
  onConnectTelegram,
}: StudyWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(materials[0]?.id);
  const [selectedCitation, setSelectedCitation] = useState<Citation | undefined>();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const selectedMaterial = materials.find((material) => material.id === selectedId);

  function openMaterial(id: string) {
    setSelectedId(id);
    setSelectedCitation(undefined);
    setIsLibraryOpen(false);
    if (window.matchMedia("(max-width: 1279px)").matches) setIsSourceOpen(true);
  }

  function openCitation(citation: Citation) {
    setSelectedId(citation.materialId);
    setSelectedCitation(citation);
    if (window.matchMedia("(max-width: 1279px)").matches) setIsSourceOpen(true);
  }

  const library = (
    <MaterialLibrary
      materials={materials}
      onSelect={openMaterial}
      onUploadClick={() => { setIsLibraryOpen(false); setIsUploadOpen(true); }}
      selectedId={selectedId}
    />
  );

  const source = (
    <SourceViewer
      citation={selectedCitation}
      material={selectedMaterial}
      preview={selectedMaterial ? previews[selectedMaterial.id] : undefined}
    />
  );

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button aria-label="Open library" className="lg:hidden" onClick={() => setIsLibraryOpen(true)} size="icon" variant="ghost">
            <Menu />
          </Button>
          <span className="font-heading text-xl font-semibold tracking-tight">StudyLens</span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <BookOpenText className="size-4" /> My study library
        </div>
        <div className="flex items-center gap-3">
          <Badge className="hidden sm:inline-flex" variant="outline">UI preview</Badge>
          <Button aria-label="Account and connections" onClick={() => setIsAccountOpen(true)} size="icon" variant="ghost">
            <Avatar size="sm"><AvatarFallback>S</AvatarFallback></Avatar>
          </Button>
        </div>
      </header>

      <main className="grid w-full min-w-0 min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,28%)]">
        <aside className="hidden min-h-0 min-w-0 border-r border-border lg:block">{library}</aside>
        <section className="flex min-h-[calc(100svh-4rem)] min-w-0 flex-col xl:min-h-0">
          <div className="border-b border-border px-5 py-6 sm:px-8 sm:py-8 xl:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Ask your materials</h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Find answers grounded in your notes, PDFs, and lectures.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {quiz && (
                  <Button aria-pressed={showQuiz} onClick={() => setShowQuiz((current) => !current)} size="sm" variant="outline">
                    <Sparkles className="size-4" /><span className="hidden sm:inline">Practice</span>
                  </Button>
                )}
                <Button aria-label="View source" className="xl:hidden" onClick={() => setIsSourceOpen(true)} size="sm" variant="outline">
                  <BookOpenText className="size-4" /><span className="hidden sm:inline">View source</span>
                </Button>
              </div>
            </div>
          </div>
          <ChatThread
            messages={messages}
            onOpenCitation={openCitation}
            onRetry={onRetry}
            quiz={showQuiz ? quiz ?? undefined : undefined}
            state={chatState}
          />
          <ChatComposer isBusy={chatState === "searching" || chatState === "streaming"} onSend={onSend} />
        </section>
        <aside className="hidden min-h-0 min-w-0 border-l border-border xl:block">{source}</aside>
      </main>

      <Sheet onOpenChange={setIsLibraryOpen} open={isLibraryOpen}>
        <SheetContent className="gap-0 p-0" side="left">
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Library</SheetTitle><SheetDescription>Your study materials</SheetDescription>
          </SheetHeader>
          {library}
        </SheetContent>
      </Sheet>
      <Sheet onOpenChange={setIsSourceOpen} open={isSourceOpen}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-xl!" side="right">
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Source viewer</SheetTitle><SheetDescription>{selectedMaterial?.title ?? "Select a material"}</SheetDescription>
          </SheetHeader>
          <SourceViewer
            citation={selectedCitation}
            material={selectedMaterial}
            preview={selectedMaterial ? previews[selectedMaterial.id] : undefined}
            showHeading={false}
          />
        </SheetContent>
      </Sheet>
      <MaterialUpload isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} onUpload={onUpload} />
      <AccountDialog isOpen={isAccountOpen} onConnectTelegram={onConnectTelegram} onOpenChange={setIsAccountOpen} />
    </div>
  );
}
