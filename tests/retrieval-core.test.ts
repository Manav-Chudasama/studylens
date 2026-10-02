import { describe, expect, test } from "bun:test";

import { finalizeGroundedAnswer } from "@/lib/grounded-answer";
import { chunkSourcePages, IndexingError } from "@/lib/ingestion";

describe("retrieval preparation", () => {
  test("chunks stay linked to their PDF page", () => {
    const chunks = chunkSourcePages([
      { pageNumber: 1, text: "Breadth first search visits vertices using a queue. ".repeat(40) },
      { pageNumber: 2, text: "Its complexity is O(V + E)." },
    ]);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks.at(-1)?.pageNumber).toBe(2);
    expect(chunks.every((chunk) => chunk.content.length <= 1400)).toBe(true);
  });

  test("scanned PDF pages without text are rejected", () => {
    expect(() => chunkSourcePages([{ pageNumber: 1, text: "   " }])).toThrow(IndexingError);
  });
});

describe("grounded answer validation", () => {
  const passage = {
    chunk_id: "chunk-1",
    material_id: "material-1",
    material_title: "Graphs.pdf",
    page_number: 4,
    content: "Breadth first search runs in O(V + E) time.",
  };

  test("keeps only citations to retrieved passages", () => {
    const result = finalizeGroundedAnswer({
      supported: true,
      claims: [{ text: "BFS takes O(V + E) time.", citationIds: ["chunk-1"] }],
    }, [passage]);
    expect(result.content).toContain("O(V + E)");
    expect(result.citations[0].location).toEqual({ kind: "page", page: 4 });
  });

  test("refuses claims with invented citations", () => {
    const result = finalizeGroundedAnswer({
      supported: true,
      claims: [{ text: "An invented answer.", citationIds: ["made-up"] }],
    }, [passage]);
    expect(result.content).toContain("couldn't find enough support");
    expect(result.citations).toEqual([]);
  });
});
