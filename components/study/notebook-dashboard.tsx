"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  Database,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

import { AccountDialog } from "@/components/study/account-dialog";
import { ThemeToggle } from "@/components/study/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { previewViewer, sampleNotebookContent, sampleNotebooks } from "@/lib/notebook-fixtures";
import type { StudyNotebook } from "@/lib/study-types";
import { notebookDetailsSchema, useNotebookHydration, useNotebookStore } from "@/lib/use-notebook-store";

const notebookIcons = [BookOpenText, Database, BrainCircuit, CalendarDays];

/** Notebook landing page for the future authenticated study space. */
export function NotebookDashboard() {
  const router = useRouter();
  const createdNotebooks = useNotebookStore((state) => state.createdNotebooks);
  const deletedNotebookIds = useNotebookStore((state) => state.deletedNotebookIds);
  const createNotebook = useNotebookStore((state) => state.createNotebook);
  const updateNotebook = useNotebookStore((state) => state.updateNotebook);
  const deleteNotebook = useNotebookStore((state) => state.deleteNotebook);
  const hasHydrated = useNotebookHydration();

  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<StudyNotebook | null>(null);
  const [deletingNotebook, setDeletingNotebook] = useState<StudyNotebook | null>(null);

  const notebooks = [...createdNotebooks, ...sampleNotebooks]
    .filter((nb) => !deletedNotebookIds.includes(nb.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const filteredNotebooks = notebooks.filter((notebook) =>
    `${notebook.title} ${notebook.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const featuredNotebooks = filteredNotebooks.filter((notebook) => {
    const content = sampleNotebookContent[notebook.id];
    return content && (content.materials.length > 0 || content.conversations.length > 0);
  }).slice(0, 2);

  function create(details: { title: string; description: string }) {
    const id = createNotebook(details);
    setIsCreateOpen(false);
    router.push(`/notebooks/${id}`);
  }

  function handleSaveEdit(details: { title: string; description: string }) {
    if (!editingNotebook) return;
    updateNotebook(editingNotebook.id, details);
    setEditingNotebook(null);
  }

  function handleConfirmDelete() {
    if (!deletingNotebook) return;
    deleteNotebook(deletingNotebook.id);
    setDeletingNotebook(null);
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <Link className="inline-flex shrink-0 items-center gap-2 font-heading text-xl font-semibold tracking-tight" href="/">
            <BookOpenText aria-hidden="true" className="size-6" /> StudyLens
          </Link>
          <span className="hidden border-l border-border pl-4 text-sm font-medium text-muted-foreground sm:inline">My notebooks</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden w-56 lg:block">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search notebooks" className="h-9 pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search notebooks" value={query} />
            </div>
            <ThemeToggle />
            <Button aria-label={`Account for ${previewViewer.displayName}`} onClick={() => setIsAccountOpen(true)} size="icon" variant="ghost">
              <Avatar size="sm"><AvatarFallback>S</AvatarFallback></Avatar>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-12 px-5 py-9 sm:px-8 sm:py-12">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Your study space</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your notebooks</h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Keep each course and topic together, from source material to saved conversations.</p>
          </div>
          <Button className="w-full sm:w-auto" disabled={!hasHydrated} onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" className="size-4" /> New notebook
          </Button>
        </section>

        <div className="relative lg:hidden">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search notebooks" className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search notebooks" value={query} />
        </div>

        {filteredNotebooks.length === 0 ? (
          <Card className="border border-dashed border-border py-12 text-center shadow-none ring-0">
            <CardContent className="space-y-2">
              <BookOpenText aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">No notebooks found</h2>
              <p className="text-sm text-muted-foreground">Try another search or create a new notebook.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {featuredNotebooks.length > 0 && <section className="space-y-5" aria-labelledby="continue-heading">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl" id="continue-heading">Continue studying</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {featuredNotebooks.map((notebook, index) => (
                  <NotebookCard
                    featured
                    index={index}
                    key={notebook.id}
                    notebook={notebook}
                    onDelete={() => setDeletingNotebook(notebook)}
                    onEdit={() => setEditingNotebook(notebook)}
                  />
                ))}
              </div>
            </section>}

            <section className="space-y-5" aria-labelledby="all-heading">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl" id="all-heading">All notebooks</h2>
                <span className="text-sm text-muted-foreground">{filteredNotebooks.length} {filteredNotebooks.length === 1 ? "notebook" : "notebooks"}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredNotebooks.map((notebook, index) => (
                  <NotebookCard
                    index={index}
                    key={notebook.id}
                    notebook={notebook}
                    onDelete={() => setDeletingNotebook(notebook)}
                    onEdit={() => setEditingNotebook(notebook)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <p className="border-t border-border pt-5 text-xs text-muted-foreground">New notebook names are saved in this browser while account storage is being built.</p>
      </main>

      <NewNotebookDialog isOpen={isCreateOpen} onCreate={create} onOpenChange={setIsCreateOpen} />
      {editingNotebook && (
        <EditNotebookDialog
          isOpen={Boolean(editingNotebook)}
          notebook={editingNotebook}
          onOpenChange={(open) => !open && setEditingNotebook(null)}
          onSave={handleSaveEdit}
        />
      )}
      {deletingNotebook && (
        <DeleteNotebookDialog
          isOpen={Boolean(deletingNotebook)}
          notebookTitle={deletingNotebook.title}
          onConfirm={handleConfirmDelete}
          onOpenChange={(open) => !open && setDeletingNotebook(null)}
        />
      )}
      <AccountDialog isOpen={isAccountOpen} onOpenChange={setIsAccountOpen} viewer={previewViewer} />
    </div>
  );
}

function NotebookCard({
  notebook,
  index,
  featured = false,
  onEdit,
  onDelete,
}: {
  notebook: StudyNotebook;
  index: number;
  featured?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = notebookIcons[index % notebookIcons.length];
  const content = sampleNotebookContent[notebook.id];
  const materialCount = content?.materials.length ?? 0;
  const chatCount = content?.conversations.length ?? 0;
  const updated = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    ...(content ? { timeZone: "UTC" } : {}),
  }).format(new Date(notebook.updatedAt));

  return (
    <div className="group relative block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25">
      <Link className="block h-full" href={`/notebooks/${notebook.id}`}>
        <Card className="h-full gap-0 overflow-hidden py-0 shadow-none ring-1 ring-border transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
          <div className={`relative flex items-start justify-between overflow-hidden border-b border-border bg-muted p-5 ${featured ? "h-40 sm:h-44" : "h-28"}`}>
            <div aria-hidden="true" className="absolute -right-8 -bottom-20 size-56 rounded-full border-[24px] border-background/70" />
            <div aria-hidden="true" className="absolute right-10 -bottom-16 size-36 rounded-full border-[18px] border-background/50" />
            <span className="relative flex size-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm"><Icon aria-hidden="true" className="size-5" /></span>
            <div className="relative z-10 flex items-center gap-1">
              <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col p-5">
            <h3 className="truncate font-heading text-lg font-semibold">{notebook.title}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{notebook.description || "Your new study space"}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{materialCount} {materialCount === 1 ? "source" : "sources"}</span>
              <span>{chatCount} {chatCount === 1 ? "chat" : "chats"}</span>
              <span className="ml-auto">Updated {updated}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Dropdown Menu for Notebook Actions */}
      <div className="absolute right-3 top-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Options for ${notebook.title}`}
            className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/80 text-muted-foreground opacity-80 backdrop-blur-xs transition-opacity hover:opacity-100 hover:text-foreground focus:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="gap-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="size-3.5" /> Edit details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-xs text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="size-3.5" /> Delete notebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function NewNotebookDialog({ isOpen, onOpenChange, onCreate }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onCreate: (details: { title: string; description: string }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = notebookDetailsSchema.safeParse({ title, description });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your notebook details.");
      return;
    }
    setError("");
    onCreate(result.data);
    setTitle("");
    setDescription("");
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Create notebook</DialogTitle>
          <DialogDescription>Group materials, practice questions, and notes for one topic.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="notebook-title">Title</Label>
            <Input id="notebook-title" onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Linear Algebra, Distributed Systems" value={title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notebook-description">Description</Label>
            <Textarea className="min-h-24 resize-none" id="notebook-description" onChange={(event) => setDescription(event.target.value)} placeholder="Optional summary or syllabus goals" value={description} />
          </div>
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
            <Button type="submit">Create notebook</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditNotebookDialog({
  isOpen,
  notebook,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  notebook: StudyNotebook;
  onOpenChange: (open: boolean) => void;
  onSave: (details: { title: string; description: string }) => void;
}) {
  const [title, setTitle] = useState(notebook.title);
  const [description, setDescription] = useState(notebook.description);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = notebookDetailsSchema.safeParse({ title, description });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your notebook details.");
      return;
    }
    setError("");
    onSave(result.data);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit notebook</DialogTitle>
          <DialogDescription>Update the title or summary for this notebook.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="edit-notebook-title">Title</Label>
            <Input id="edit-notebook-title" onChange={(event) => setTitle(event.target.value)} value={title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notebook-description">Description</Label>
            <Textarea className="min-h-24 resize-none" id="edit-notebook-description" onChange={(event) => setDescription(event.target.value)} value={description} />
          </div>
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteNotebookDialog({
  isOpen,
  notebookTitle,
  onOpenChange,
  onConfirm,
}: {
  isOpen: boolean;
  notebookTitle: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-destructive">Delete notebook?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{notebookTitle}&rdquo;? This will remove its materials and conversations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
          <Button onClick={onConfirm} type="button" variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
