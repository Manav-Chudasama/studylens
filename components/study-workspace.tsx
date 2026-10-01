"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { BookOpenText, History, LogIn, Menu, PanelLeftOpen, PanelRightOpen, Sparkles } from "lucide-react";

import { AccountDialog } from "@/components/study/account-dialog";
import { ChatComposer, type ChatSubmission } from "@/components/study/chat-composer";
import { ChatHistoryDialog } from "@/components/study/chat-history-dialog";
import { ChatThread, type ChatState } from "@/components/study/chat-thread";
import { MaterialLibrary } from "@/components/study/material-library";
import { MaterialUpload, type MaterialUploadRequest } from "@/components/study/material-upload";
import { SourceViewer } from "@/components/study/source-viewer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  StudyConversation,
  StudyMessage,
  StudyUser,
} from "@/lib/study-types";
import { cn } from "@/lib/utils";

type StudyWorkspaceProps = {
  notebookTitle?: string;
  materials?: Material[];
  messages?: StudyMessage[];
  previews?: Record<string, SourcePreview>;
  quiz?: QuizQuestion | null;
  chatState?: ChatState;
  viewer?: StudyUser | null;
  conversations?: StudyConversation[];
  initialConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onUpload?: (request: MaterialUploadRequest) => Promise<void>;
  onSend?: (submission: ChatSubmission) => Promise<void>;
  onRetry?: () => void;
  onConnectTelegram?: () => Promise<string>;
};

/** Composes the study UI around typed data and optional future backend actions. */
export function StudyWorkspace({
  notebookTitle,
  materials = sampleMaterials,
  messages = sampleMessages,
  previews = samplePreviews,
  quiz = sampleQuiz,
  chatState = "idle",
  viewer = null,
  conversations = [],
  initialConversationId,
  onSelectConversation,
  onUpload,
  onSend,
  onRetry,
  onConnectTelegram,
}: StudyWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(materials[0]?.id);
  const [selectedCitation, setSelectedCitation] = useState<Citation | undefined>();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
  const [isSourceExpanded, setIsSourceExpanded] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(initialConversationId);
  const selectedConversation = viewer && conversations.find((conversation) => conversation.id === selectedConversationId);
  const visibleMessages = selectedConversation?.messages ?? messages;
  const selectedMaterial = materials.find((material) => material.id === selectedId);

  function selectConversation(id: string) {
    if (!viewer) return;
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation) return;
    setSelectedConversationId(id);
    setSelectedId(conversation.messages.flatMap((message) => message.citations)[0]?.materialId);
    setSelectedCitation(undefined);
    setIsSourceOpen(false);
    setShowQuiz(false);
    setIsHistoryOpen(false);
    onSelectConversation?.(id);
  }

  function openMaterial(id: string) {
    setSelectedId(id);
    setSelectedCitation(undefined);
    setIsLibraryOpen(false);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setIsSourceOpen(true);
    } else {
      setIsSourceExpanded(true);
    }
  }

  function openCitation(citation: Citation) {
    setSelectedId(citation.materialId);
    setSelectedCitation(citation);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setIsSourceOpen(true);
    } else {
      setIsSourceExpanded(true);
    }
  }

  const libraryProps = {
    materials,
    onSelect: openMaterial,
    onUploadClick: () => { setIsLibraryOpen(false); setIsUploadOpen(true); },
    selectedId,
  };
  const sourceProps = {
    citation: selectedCitation,
    material: selectedMaterial,
    preview: selectedMaterial ? previews[selectedMaterial.id] : undefined,
  };

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button aria-controls="library-drawer" aria-expanded={isLibraryOpen} aria-label="Open library" className="lg:hidden" onClick={() => setIsLibraryOpen(true)} size="icon" variant="ghost">
            <Menu />
          </Button>
          {!isLibraryExpanded && (
            <Button aria-controls="library-sidebar" aria-expanded={false} aria-label="Expand library" className="hidden lg:inline-flex" onClick={() => setIsLibraryExpanded(true)} size="icon" type="button" variant="ghost">
              <PanelLeftOpen />
            </Button>
          )}
          {notebookTitle ? (
            <Link className="font-heading text-xl font-semibold tracking-tight" href="/dashboard">StudyLens</Link>
          ) : (
            <span className="font-heading text-xl font-semibold tracking-tight">StudyLens</span>
          )}
        </div>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <BookOpenText className="size-4" />
          {notebookTitle ? (
            <><Link className="hover:text-foreground" href="/dashboard">Notebooks</Link><span aria-hidden="true">/</span><span className="max-w-48 truncate text-foreground">{notebookTitle}</span></>
          ) : "My study library"}
        </div>
        {viewer ? (
          <Button aria-label={`Account for ${viewer.displayName}`} onClick={() => setIsAccountOpen(true)} size="icon" variant="ghost">
            <Avatar size="sm"><AvatarFallback>{viewer.displayName.trim().charAt(0).toUpperCase() || "S"}</AvatarFallback></Avatar>
          </Button>
        ) : (
          <Button nativeButton={false} render={<Link href="/auth/sign-in" />} size="sm" variant="outline">
            <LogIn aria-hidden="true" className="size-4" /> Sign in
          </Button>
        )}
      </header>

      <main
        className="grid min-h-0 min-w-0 w-full flex-1 overflow-hidden motion-safe:transition-[grid-template-columns] motion-safe:duration-300 motion-safe:ease-in-out lg:grid-cols-[var(--library-width)_minmax(0,1fr)] xl:grid-cols-[var(--library-width)_minmax(0,1fr)_var(--source-width)]"
        style={{
          "--library-width": isLibraryExpanded ? "280px" : "0px",
          "--source-width": isSourceExpanded ? "28%" : "0%",
        } as CSSProperties}
      >
        <aside
          aria-hidden={!isLibraryExpanded}
          id="library-sidebar"
          inert={!isLibraryExpanded}
          className={cn(
            "hidden min-h-0 min-w-0 overflow-hidden border-r border-border lg:flex motion-safe:transition-opacity motion-safe:duration-200",
            isLibraryExpanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <MaterialLibrary {...libraryProps} onCollapse={() => setIsLibraryExpanded(false)} />
        </aside>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-5 py-6 sm:px-8 sm:py-8 xl:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{selectedConversation?.title ?? "Ask your materials"}</h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Find answers grounded in your notes, PDFs, and lectures.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button aria-label="Previous chats" onClick={() => setIsHistoryOpen(true)} size="icon-sm" title="Previous chats" variant="outline">
                  <History aria-hidden="true" className="size-4" />
                </Button>
                {quiz && (
                  <Button aria-pressed={showQuiz} onClick={() => setShowQuiz((current) => !current)} size="sm" variant="outline">
                    <Sparkles className="size-4" /><span className="hidden sm:inline">Practice</span>
                  </Button>
                )}
                <Button aria-controls="source-drawer" aria-expanded={isSourceOpen} aria-label="View source" className="xl:hidden" onClick={() => setIsSourceOpen(true)} size="sm" variant="outline">
                  <BookOpenText className="size-4" /><span className="hidden sm:inline">View source</span>
                </Button>
                {!isSourceExpanded && (
                  <Button aria-controls="source-sidebar" aria-expanded={false} aria-label="Expand source viewer" className="hidden xl:inline-flex" onClick={() => setIsSourceExpanded(true)} size="sm" type="button" variant="outline">
                    <PanelRightOpen className="size-4" /><span>Source viewer</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <ChatThread
            key={selectedConversationId ?? "current"}
            messages={visibleMessages}
            onOpenCitation={openCitation}
            onRetry={onRetry}
            quiz={showQuiz ? quiz ?? undefined : undefined}
            state={chatState}
          />
          <ChatComposer isBusy={chatState === "searching" || chatState === "streaming"} onSend={onSend} />
        </section>
        <aside
          aria-hidden={!isSourceExpanded}
          id="source-sidebar"
          inert={!isSourceExpanded}
          className={cn(
            "hidden min-h-0 min-w-0 overflow-hidden border-l border-border xl:flex motion-safe:transition-opacity motion-safe:duration-200",
            isSourceExpanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <SourceViewer {...sourceProps} onCollapse={() => setIsSourceExpanded(false)} />
        </aside>
      </main>

      <Sheet onOpenChange={setIsLibraryOpen} open={isLibraryOpen}>
        <SheetContent className="min-h-0 gap-0 overflow-hidden p-0" id="library-drawer" side="left">
          <SheetHeader className="shrink-0 border-b border-border pr-12">
            <SheetTitle>Library</SheetTitle><SheetDescription>Your study materials</SheetDescription>
          </SheetHeader>
          <MaterialLibrary {...libraryProps} />
        </SheetContent>
      </Sheet>
      <Sheet onOpenChange={setIsSourceOpen} open={isSourceOpen}>
        <SheetContent className="min-h-0 w-full gap-0 overflow-hidden p-0 sm:max-w-xl!" id="source-drawer" side="right">
          <SheetHeader className="shrink-0 border-b border-border pr-12">
            <SheetTitle>Source viewer</SheetTitle><SheetDescription>{selectedMaterial?.title ?? "Select a material"}</SheetDescription>
          </SheetHeader>
          <SourceViewer {...sourceProps} showHeading={false} />
        </SheetContent>
      </Sheet>
      <MaterialUpload isOpen={isUploadOpen} onOpenChange={setIsUploadOpen} onUpload={onUpload} />
      <ChatHistoryDialog
        conversations={viewer ? conversations : []}
        isOpen={isHistoryOpen}
        isSignedIn={Boolean(viewer)}
        onOpenChange={setIsHistoryOpen}
        onSelect={selectConversation}
        selectedId={selectedConversationId}
      />
      <AccountDialog isOpen={isAccountOpen} onConnectTelegram={onConnectTelegram} onOpenChange={setIsAccountOpen} viewer={viewer} />
    </div>
  );
}
