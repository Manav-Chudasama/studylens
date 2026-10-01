"use client";

import { useState } from "react";
import { ArrowUp, BookOpenText, ChevronRight, FileText, Library, Menu, Paperclip, PlayCircle, Plus, Search, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MaterialType = "pdf" | "note" | "video";
type Filter = "all" | MaterialType;
type Material = { id: string; name: string; type: MaterialType; detail: string; added: string };

const materials: Material[] = [
  { id: "algorithms", name: "Algorithms Notes.pdf", type: "pdf", detail: "PDF · 42 pages", added: "Added 2 days ago" },
  { id: "revision", name: "DSA Revision.md", type: "note", detail: "Markdown · 12 sections", added: "Added 4 days ago" },
  { id: "graphs", name: "Graphs Lecture", type: "video", detail: "Video · 56 minutes", added: "Added 1 week ago" },
];

/** Responsive preview of the StudyLens library, chat, and source viewer. */
export function StudyWorkspace() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sourceId, setSourceId] = useState("algorithms");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const source = materials.find((material) => material.id === sourceId) ?? materials[0];

  function openSource(id: string) {
    setSourceId(id);
    setIsLibraryOpen(false);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setIsSourceOpen(true);
    }
  }

  const library = (
    <LibraryPanel filter={filter} onFilterChange={setFilter} onSelect={openSource} sourceId={sourceId} />
  );

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button aria-label="Open library" className="lg:hidden" onClick={() => setIsLibraryOpen(true)} size="icon" variant="ghost"><Menu /></Button>
          <span className="font-heading text-xl font-semibold tracking-tight">StudyLens</span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><BookOpenText className="size-4" />My study library</div>
        <div className="flex items-center gap-3">
          <Badge className="hidden sm:inline-flex" variant="outline">Layout preview</Badge>
          <Avatar size="sm"><AvatarFallback>S</AvatarFallback></Avatar>
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
              <Button aria-label="View source" className="xl:hidden" onClick={() => setIsSourceOpen(true)} size="sm" variant="outline"><BookOpenText className="size-4" /><span className="hidden sm:inline">View source</span></Button>
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1"><ChatPreview onSourceSelect={openSource} /></ScrollArea>
          <div className="border-t border-border bg-background p-4 sm:px-8 sm:py-5">
            <Card className="gap-0 border-border p-0 shadow-none">
              <label className="sr-only" htmlFor="study-prompt">Ask a question about your materials</label>
              <Textarea className="min-h-20 resize-none border-0 bg-transparent px-4 pt-4 shadow-none focus-visible:ring-0" disabled id="study-prompt" placeholder="Ask a question about your materials..." />
              <div className="flex items-center justify-between px-3 pb-3">
                <Button aria-label="Attach material" disabled size="icon" variant="ghost"><Paperclip /></Button>
                <Button aria-label="Send message" disabled size="icon"><ArrowUp /></Button>
              </div>
            </Card>
            <p className="mt-2 text-center text-xs text-muted-foreground">Chat and uploads will be connected in the next phase.</p>
          </div>
        </section>
        <aside className="hidden min-h-0 min-w-0 border-l border-border xl:block"><SourcePanel material={source} /></aside>
      </main>

      <Sheet onOpenChange={setIsLibraryOpen} open={isLibraryOpen}>
        <SheetContent className="gap-0 p-0" side="left">
          <SheetHeader className="border-b border-border pr-12"><SheetTitle>Library</SheetTitle><SheetDescription>Your study materials</SheetDescription></SheetHeader>
          {library}
        </SheetContent>
      </Sheet>
      <Sheet onOpenChange={setIsSourceOpen} open={isSourceOpen}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-xl!" side="right">
          <SheetHeader className="border-b border-border pr-12"><SheetTitle>Source viewer</SheetTitle><SheetDescription>{source.name}</SheetDescription></SheetHeader>
          <SourcePanel material={source} showHeading={false} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LibraryPanel({ filter, onFilterChange, onSelect, sourceId }: { filter: Filter; onFilterChange: (filter: Filter) => void; onSelect: (id: string) => void; sourceId: string }) {
  const visible = materials.filter((material) => filter === "all" || material.type === filter);
  return (
    <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
      <div className="mb-5 hidden items-center justify-between lg:flex"><h2 className="font-heading text-lg font-semibold">Library</h2><Search aria-hidden="true" className="size-4 text-muted-foreground" /></div>
      <Button className="h-10 w-full justify-center" disabled><Plus />Upload material</Button>
      <Tabs className="mt-5" onValueChange={(value) => onFilterChange(value as Filter)} value={filter}>
        <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pdf">PDF</TabsTrigger><TabsTrigger value="note">Notes</TabsTrigger><TabsTrigger value="video">Videos</TabsTrigger></TabsList>
      </Tabs>
      <ScrollArea className="mt-5 min-h-0 flex-1"><div className="space-y-2 pr-1">{visible.map((material) => <MaterialItem isActive={material.id === sourceId} key={material.id} material={material} onSelect={onSelect} />)}</div></ScrollArea>
      <Separator className="my-4" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Library className="size-4" />3 sample materials</div>
    </div>
  );
}

function MaterialItem({ isActive, material, onSelect }: { isActive: boolean; material: Material; onSelect: (id: string) => void }) {
  const Icon = material.type === "video" ? PlayCircle : FileText;
  return (
    <button aria-current={isActive ? "true" : undefined} className={cn("flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isActive ? "border-border bg-muted" : "border-transparent")} onClick={() => onSelect(material.id)} type="button">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background"><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{material.name}</span><span className="mt-1 block text-xs text-muted-foreground">{material.detail}</span><span className="mt-1 block text-xs text-muted-foreground">{material.added}</span></span>
    </button>
  );
}

function ChatPreview({ onSourceSelect }: { onSourceSelect: (id: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-start gap-3"><Avatar className="mt-0.5"><AvatarFallback>S</AvatarFallback></Avatar><Card className="flex-1 gap-0 border-border bg-muted px-4 py-3 shadow-none"><p className="text-sm font-medium">What is the time complexity of BFS?</p></Card></div>
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"><Sparkles className="size-4" /></span>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Search className="size-3.5" />Searched 3 materials</div>
          <p className="text-sm leading-7 sm:text-base">Breadth-First Search runs in <strong>O(V + E)</strong> time, where V is the number of vertices and E is the number of edges. It visits each vertex once and examines each edge at most twice in an undirected graph. <CitationButton label="1" onClick={() => onSourceSelect("algorithms")} />{" "}<CitationButton label="2" onClick={() => onSourceSelect("revision")} /></p>
          <div><h3 className="mb-3 text-sm font-semibold">Sources</h3><div className="space-y-2">
            <SourceCard detail="Page 4 · Breadth-First Search" index={1} name="Algorithms Notes.pdf" onClick={() => onSourceSelect("algorithms")} snippet="BFS visits each vertex at most once and examines each edge..." />
            <SourceCard detail="Section 3.2 · Graph Traversal" index={2} name="DSA Revision.md" onClick={() => onSourceSelect("revision")} snippet="The time complexity of BFS is O(V + E)..." />
          </div></div>
        </div>
      </div>
    </div>
  );
}

function CitationButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button aria-label={`Open source ${label}`} className="inline-flex rounded bg-muted px-1.5 py-0.5 align-baseline text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClick} type="button">[{label}]</button>;
}

function SourceCard({ detail, index, name, onClick, snippet }: { detail: string; index: number; name: string; onClick: () => void; snippet: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClick} type="button">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"><FileText className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{index}. {name}</span><span className="block truncate text-xs text-muted-foreground">{detail}</span><span className="block truncate text-xs text-muted-foreground">{snippet}</span></span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function SourcePanel({ material, showHeading = true }: { material: Material; showHeading?: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeading && <div className="flex items-center justify-between border-b border-border px-5 py-5"><h2 className="font-heading text-lg font-semibold">Source viewer</h2><Badge variant="outline">{material.type === "pdf" ? "Page 4 / 42" : material.type === "video" ? "14:32" : "Section 3.2"}</Badge></div>}
      <ScrollArea className="min-h-0 flex-1 bg-muted/40 p-4 sm:p-5"><div className="mx-auto max-w-lg border border-border bg-card px-6 py-8 shadow-sm sm:px-9 sm:py-10">
        {material.type === "pdf" && <PdfPreview />}
        {material.type === "note" && <NotePreview />}
        {material.type === "video" && <VideoPreview />}
      </div></ScrollArea>
    </div>
  );
}

function PdfPreview() {
  return <article className="font-serif text-sm leading-7 text-card-foreground"><h3 className="mb-7 text-2xl font-semibold leading-tight">Breadth-First Search</h3><h4 className="mb-3 text-lg font-semibold">3.1 Overview</h4><p>Breadth-First Search (BFS) is a graph traversal algorithm that explores a graph level by level, starting from a given source vertex.</p><div className="my-6 rounded-md bg-muted px-3 py-3 ring-1 ring-border"><span className="mb-2 block font-sans text-xs font-medium text-muted-foreground">Page 4 · Cited passage</span><p>BFS visits each vertex at most once and examines each edge at most twice in an undirected graph. Using an adjacency list, its total time complexity is O(V + E), where V is the number of vertices and E is the number of edges.</p></div><h4 className="mb-3 text-lg font-semibold">3.2 Algorithm</h4><p>BFS uses a queue to maintain the frontier of vertices to be explored.</p></article>;
}

function NotePreview() {
  return <article className="space-y-5 text-sm leading-7 text-card-foreground"><div><p className="mb-2 text-xs font-medium text-muted-foreground">DSA Revision.md · Section 3.2</p><h3 className="text-2xl font-semibold tracking-tight">Graph traversal</h3></div><p>Use Breadth-First Search when exploring the vertices of an unweighted graph by distance from a starting vertex.</p><div className="rounded-md bg-muted px-3 py-3 ring-1 ring-border"><span className="mb-2 block text-xs font-medium text-muted-foreground">Cited passage</span><p>The time complexity of BFS is O(V + E) since each vertex enters the queue once and each edge is examined during traversal.</p></div><p>Keep a visited set and enqueue each newly discovered neighbor.</p></article>;
}

function VideoPreview() {
  return <article className="space-y-5 text-sm leading-7 text-card-foreground"><div className="flex aspect-video items-center justify-center rounded-md bg-muted"><PlayCircle className="size-12 text-muted-foreground" /></div><div><p className="mb-2 text-xs font-medium text-muted-foreground">Graphs Lecture · 14:32</p><h3 className="text-2xl font-semibold tracking-tight">Transcript excerpt</h3></div><div className="rounded-md bg-muted px-3 py-3 ring-1 ring-border"><span className="mb-2 block text-xs font-medium text-muted-foreground">Sample excerpt</span><p>We visit the vertices one layer at a time. The queue holds the next vertices to explore.</p></div></article>;
}
