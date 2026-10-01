import { FileText, PanelRightClose, PlayCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Citation, Material, SourceLocation, SourcePreview } from "@/lib/study-types";

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
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
      <ScrollArea className="min-h-0 flex-1 bg-muted/40 p-4 [&_[data-slot=scroll-area-viewport]]:overscroll-contain sm:p-5">
        {!material && (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Select a material or citation to inspect its source.
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
        {material?.status === "ready" && !preview && (
          <Alert><FileText className="size-4" /><AlertDescription>The source preview is unavailable.</AlertDescription></Alert>
        )}
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
