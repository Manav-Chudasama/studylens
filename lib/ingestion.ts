import type { MaterialRow } from "@/lib/materials";

export type SourcePage = { pageNumber: number | null; text: string };
export type SourceChunk = { chunkIndex: number; pageNumber: number | null; content: string };

const MAX_INDEX_CHARS = 250_000;
const MAX_PDF_PAGES = 200;
const CHUNK_CHARS = 1_400;
const OVERLAP_CHARS = 180;

export class IndexingError extends Error {}

/** Extract text while retaining PDF page boundaries for citations. */
export async function extractSourcePages(material: MaterialRow, file?: Blob): Promise<SourcePage[]> {
  if (material.kind === "note") return [{ pageNumber: null, text: material.content_text ?? "" }];
  if (!file) throw new IndexingError("The stored file is missing.");
  if (material.kind === "txt" || material.kind === "md") {
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      return [{ pageNumber: null, text: decoder.decode(await file.arrayBuffer()) }];
    } catch {
      throw new IndexingError("This text file is not UTF-8 encoded.");
    }
  }

  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
  try {
    const document = await task.promise;
    if (document.numPages > MAX_PDF_PAGES) {
      throw new IndexingError(`PDF indexing supports up to ${MAX_PDF_PAGES} pages.`);
    }
    const pages: SourcePage[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push({
        pageNumber,
        text: text.items.map((item) => "str" in item ? item.str : "").join(" "),
      });
      page.cleanup();
    }
    return pages;
  } finally {
    await task.destroy();
  }
}

/** Split page text into overlapping, source-linked passages. */
export function chunkSourcePages(pages: SourcePage[]): SourceChunk[] {
  let totalChars = 0;
  let chunkIndex = 0;
  const chunks: SourceChunk[] = [];
  for (const page of pages) {
    const text = page.text.replace(/\s+/g, " ").trim();
    totalChars += text.length;
    if (totalChars > MAX_INDEX_CHARS) {
      throw new IndexingError("This material has too much text to index (250,000 characters maximum).");
    }
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + CHUNK_CHARS, text.length);
      if (end < text.length) {
        const boundary = text.lastIndexOf(" ", end);
        if (boundary > start + CHUNK_CHARS / 2) end = boundary;
      }
      const content = text.slice(start, end).trim();
      if (content) chunks.push({ chunkIndex: chunkIndex++, pageNumber: page.pageNumber, content });
      if (end >= text.length) break;
      start = Math.max(start + 1, end - OVERLAP_CHARS);
    }
  }
  if (chunks.length === 0) throw new IndexingError("No extractable text was found. Scanned PDFs need OCR, which is not available yet.");
  return chunks;
}
