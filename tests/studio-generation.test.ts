import { describe, expect, test } from "bun:test";
import { podcastScriptSchema, podcastTurnSchema } from "@/lib/studio-generator";

describe("Studio synthesis schema validations", () => {
  test("podcastTurnSchema accepts valid Alex and Sam lines", () => {
    const validTurn1 = { speaker: "Alex", line: "Let's explore binary search trees." };
    const validTurn2 = { speaker: "Sam", line: "Trees offer O(log N) lookup when balanced." };

    expect(podcastTurnSchema.safeParse(validTurn1).success).toBe(true);
    expect(podcastTurnSchema.safeParse(validTurn2).success).toBe(true);
  });

  test("podcastTurnSchema rejects invalid speakers", () => {
    const invalidTurn = { speaker: "Robot", line: "Invalid speaker name." };
    expect(podcastTurnSchema.safeParse(invalidTurn).success).toBe(false);
  });

  test("podcastScriptSchema parses full valid episode structure", () => {
    const sampleEpisode = {
      episodeTitle: "Graph Traversals Deep Dive",
      overview: "A discussion comparing BFS and DFS runtime complexities.",
      dialogue: [
        { speaker: "Alex", line: "Welcome back! Today we are looking at graph algorithms." },
        { speaker: "Sam", line: "BFS uses a queue to visit vertices layer by layer." },
        { speaker: "Alex", line: "And DFS dives down paths recursively using a stack." },
        { speaker: "Sam", line: "Both achieve linear O(V + E) time on adjacency lists." },
      ],
    };

    const parsed = podcastScriptSchema.safeParse(sampleEpisode);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dialogue.length).toBe(4);
      expect(parsed.data.episodeTitle).toBe("Graph Traversals Deep Dive");
    }
  });

  test("podcastScriptSchema rejects empty dialogues", () => {
    const emptyEpisode = {
      episodeTitle: "Empty Episode",
      overview: "No dialogue",
      dialogue: [],
    };

    expect(podcastScriptSchema.safeParse(emptyEpisode).success).toBe(false);
  });
});
