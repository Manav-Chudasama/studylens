"use client";

import { useEffect, useState } from "react";
import { FileText, PanelRightClose, PlayCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Citation, Material, SourceLocation, SourcePreview } from "@/lib/study-types";
import { createClient } from "@/lib/supabase/client";

type SourceViewerProps = {
  material?: Material;
  citation?: Citation;
  preview?: SourcePreview;
  showHeading?: boolean;
  onCollapse?: () => void;
};

/** Shows the selected source and its cited passage on desktop or in a drawer. */
export function SourceViewer({
  material,
  citation,
  preview,
  showHeading = true,
  onCollapse,
}: SourceViewerProps) {
  const [storedText, setStoredText] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const storagePath = material?.storagePath;
  const isPdf = material?.sourceKind === "pdf";

  useEffect(() => {
    if (!storagePath || material?.status !== "ready") return;
    let isCancelled = false;
    let createdUrl: string | undefined;
    const load = async () => {
      setStoredText(null);
      setPdfUrl(null);
      setLoadError("");
      setIsLoading(true);
      const { data, error } = await createClient().storage.from("study-materials").download(storagePath);
      if (isCancelled) return;
      if (error || !data) {
        setLoadError("Could not load this private file.");
      } else if (isPdf) {
        createdUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        setPdfUrl(createdUrl);
      } else {
        setStoredText(await data.text());
      }
      if (!isCancelled) setIsLoading(false);
    };
    void load();
    return () => {
      isCancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [storagePath, isPdf, material?.status]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {showHeading && (
        <div className="shrink-0 border-b border-border px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading whitespace-nowrap text-lg font-semibold">Source viewer</h2>
              <p className="truncate text-xs text-muted-foreground">{material?.title ?? "Select a material"}</p>
            </div>
            {onCollapse && (
              <Button
                aria-controls="source-sidebar"
                aria-expanded={true}
                aria-label="Collapse source viewer"
                onClick={onCollapse}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <PanelRightClose />
              </Button>
            )}
          </div>
          {citation && <Badge className="mt-3 max-w-full" variant="outline">{formatLocation(citation.location)}</Badge>}
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1 bg-muted/40 [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
        <div className="p-4 sm:p-5">
        {!material && (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {citation ? "This cited material has been removed from the notebook." : "Select a material or citation to inspect its source."}
          </div>
          )}
          {material?.status === "processing" && (
            <Alert><AlertDescription>This material is still being processed.</AlertDescription></Alert>
          )}
          {material?.status === "failed" && (
            <Alert variant="destructive"><AlertDescription>This material could not be processed.</AlertDescription></Alert>
          )}
          {material?.status === "ready" && preview && (
            <div className="mx-auto max-w-lg border border-border bg-card px-6 py-8 shadow-sm sm:px-9 sm:py-10">
              {material.type === "video" ? (
                <VideoSource citation={citation} preview={preview} />
              ) : (
                <TextSource citation={citation} material={material} preview={preview} />
              )}
            </div>
          )}
        {material?.status === "ready" && !preview && material.sourceKind === "note" && (
          <article className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-6 sm:p-8">
            <h3 className="mb-5 font-heading text-xl font-semibold">{material.title}</h3>
            {citation && <div className="mb-5 rounded-md border border-border bg-muted p-3 text-sm leading-6"><p className="mb-1 text-xs font-medium text-muted-foreground">Cited passage</p>{citation.excerpt}</div>}
            <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">{material.contentText}</p>
          </article>
          )}
          {material?.status === "ready" && !preview && material.storagePath && (
            <div className="mx-auto h-full min-h-80 max-w-4xl">
              {isLoading && <p className="text-sm text-muted-foreground">Loading source…</p>}
              {loadError && <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>}
            {citation && <div className="mb-4 rounded-md border border-border bg-card p-3 text-sm leading-6"><p className="mb-1 text-xs font-medium text-muted-foreground">Cited passage</p>{citation.excerpt}</div>}
            {pdfUrl && <iframe className="h-full min-h-[70vh] w-full rounded-lg border border-border bg-card" src={`${pdfUrl}#page=${citation?.location.kind === "page" ? citation.location.page : 1}`} title={material.title} />}
              {storedText !== null && (
                <article className="rounded-lg border border-border bg-card p-6 sm:p-8">
                <h3 className="mb-5 font-heading text-xl font-semibold">{material.title}</h3>
                  <pre className="whitespace-pre-wrap wrap-break-word font-sans text-sm leading-7">{storedText}</pre>
                </article>
              )}
            </div>
          )}
          {material?.status === "ready" && !preview && !material.storagePath && material.sourceKind !== "note" && (
            <Alert><FileText className="size-4" /><AlertDescription>The source preview is unavailable.</AlertDescription></Alert>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TextSource({
  citation,
  material,
  preview,
}: {
  citation?: Citation;
  material: Material;
  preview: SourcePreview;
}) {
  return (
    <article className={material.type === "pdf" ? "font-serif text-sm leading-7" : "text-sm leading-7"}>
      <p className="mb-2 font-sans text-xs text-muted-foreground">
        {material.type === "pdf" ? "Document preview" : "Note preview"}
        {citation ? ` · ${formatLocation(citation.location)}` : ""}
      </p>
      <h3 className="mb-6 text-2xl font-semibold leading-tight">{preview.heading}</h3>
      <p>{preview.intro}</p>
      <div className="my-6 rounded-md bg-muted px-3 py-3 ring-1 ring-border">
        <span className="mb-2 block font-sans text-xs font-medium text-muted-foreground">
          {citation ? "Cited passage" : "Relevant passage"}
        </span>
        <p>{preview.excerpt}</p>
      </div>
      <p>{preview.following}</p>
    </article>
  );
}

function VideoSource({ citation, preview }: { citation?: Citation; preview: SourcePreview }) {
  return (
    <article className="space-y-5 text-sm leading-7">
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted" role="img" aria-label="Video player placeholder">
        <PlayCircle className="size-12 text-muted-foreground" />
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">{citation ? formatLocation(citation.location) : preview.intro}</p>
        <h3 className="text-2xl font-semibold tracking-tight">{preview.heading}</h3>
      </div>
      <div className="rounded-md bg-muted px-3 py-3 ring-1 ring-border">
        <span className="mb-2 block text-xs font-medium text-muted-foreground">Transcript excerpt</span>
        <p>{preview.excerpt}</p>
      </div>
      <p>{preview.following}</p>
    </article>
  );
}

export function formatLocation(location: SourceLocation): string {
  if (location.kind === "page") return `Page ${location.page}`;
  if (location.kind === "section") return `Section ${location.section}`;
  const minutes = Math.floor(location.seconds / 60);
  const seconds = String(location.seconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
