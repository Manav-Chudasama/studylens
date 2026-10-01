import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MaterialLibrary } from "@/components/study/material-library";
import { SourceViewer, formatLocation } from "@/components/study/source-viewer";
import { sampleCitations, sampleMaterials, samplePreviews } from "@/lib/study-fixtures";

describe("study UI states", () => {
  test("the library explains how to start when there are no materials", () => {
    const html = renderToStaticMarkup(
      <MaterialLibrary materials={[]} onSelect={() => {}} onUploadClick={() => {}} />,
    );

    expect(html).toContain("Your library is empty");
    expect(html).toContain("Upload material");
  });

  test("the viewer includes a cited page and excerpt", () => {
    const html = renderToStaticMarkup(
      <SourceViewer
        citation={sampleCitations[0]}
        material={sampleMaterials[0]}
        preview={samplePreviews.algorithms}
      />,
    );

    expect(html).toContain("Page 4");
    expect(html).toContain("Cited passage");
    expect(html).toContain("O(V + E)");
  });

  test("a failed material reports its state instead of showing source text", () => {
    const html = renderToStaticMarkup(
      <SourceViewer material={{ ...sampleMaterials[0], status: "failed" }} />,
    );

    expect(html).toContain("could not be processed");
    expect(html).not.toContain("Cited passage");
  });

  test("citations format page, section, and timestamp locations", () => {
    expect(formatLocation({ kind: "page", page: 4 })).toBe("Page 4");
    expect(formatLocation({ kind: "section", section: "3.2" })).toBe("Section 3.2");
    expect(formatLocation({ kind: "timestamp", seconds: 872 })).toBe("14:32");
  });
});
