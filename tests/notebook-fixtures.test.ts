import { describe, expect, test } from "bun:test";

import { sampleNotebookContent, sampleNotebooks } from "@/lib/notebook-fixtures";
import { notebookDetailsSchema } from "@/lib/use-notebook-store";

describe("notebook organization", () => {
  test("sample chats cite sources within their notebook", () => {
    for (const notebook of sampleNotebooks) {
      const content = sampleNotebookContent[notebook.id];
      const materialIds = new Set(content.materials.map((material) => material.id));
      const citations = content.conversations.flatMap((conversation) =>
        conversation.messages.flatMap((message) => message.citations),
      );

      expect(citations.every((citation) => materialIds.has(citation.materialId))).toBe(true);
    }
  });

  test("new notebook details are trimmed and validated", () => {
    expect(notebookDetailsSchema.safeParse({ title: "ab", description: "" }).success).toBe(false);
    expect(notebookDetailsSchema.safeParse({ title: "Valid notebook", description: "x".repeat(161) }).success).toBe(false);
    expect(notebookDetailsSchema.parse({ title: "  Data Structures  ", description: "  Notes  " })).toEqual({
      title: "Data Structures",
      description: "Notes",
    });
  });
});
