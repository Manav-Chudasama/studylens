import type { GroundedAnswer } from "@/lib/ai";
import type { Citation } from "@/lib/study-types";

export type RetrievedPassage = {
  chunk_id: string;
  material_id: string;
  material_title: string;
  page_number: number | null;
  content: string;
};

const refusal = "I couldn't find enough support for an answer in this notebook's indexed materials.";

/** Accept only model claims that cite a passage actually retrieved for this question. */
export function finalizeGroundedAnswer(answer: GroundedAnswer, passages: RetrievedPassage[]) {
  const byId = new Map(passages.map((passage) => [passage.chunk_id, passage]));
  const isValid = answer.supported && answer.claims.length > 0 && answer.claims.length <= 8 && answer.claims.every((claim) =>
    claim.text.length <= 2000 && claim.citationIds.length > 0 && claim.citationIds.every((id) => byId.has(id)),
  );
  if (!isValid) return { content: refusal, citations: [] as Citation[] };

  const citationIds = [...new Set(answer.claims.flatMap((claim) => claim.citationIds))];
  const citations: Citation[] = citationIds.map((id) => {
    const passage = byId.get(id)!;
    return {
      id,
      materialId: passage.material_id,
      title: passage.material_title,
      excerpt: passage.content.slice(0, 500),
      location: passage.page_number
        ? { kind: "page", page: passage.page_number }
        : { kind: "section", section: "Source passage" },
    };
  });
  return { content: answer.claims.map((claim) => claim.text).join("\n\n"), citations };
}
