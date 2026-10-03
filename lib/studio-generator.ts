import { z } from "zod";
import { generateStructuredCompletion, generateTextCompletion } from "@/lib/ai";
import type { RetrievedPassage } from "@/lib/grounded-answer";

const faqItemSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const faqResponseSchema = z.object({
  title: z.string(),
  items: z.array(faqItemSchema).min(1).max(8),
});

const cheatSheetItemSchema = z.object({
  concept: z.string(),
  summaryOrComplexity: z.string(),
  keyTakeaway: z.string(),
});

const cheatSheetResponseSchema = z.object({
  title: z.string(),
  items: z.array(cheatSheetItemSchema).min(1).max(10),
});

export const podcastTurnSchema = z.object({
  speaker: z.enum(["Alex", "Sam"]),
  line: z.string().trim().min(1),
});

export const podcastScriptSchema = z.object({
  episodeTitle: z.string(),
  overview: z.string(),
  dialogue: z.array(podcastTurnSchema).min(4).max(16),
});

export type PodcastScript = z.infer<typeof podcastScriptSchema>;

function formatPassagesContext(passages: RetrievedPassage[]): string {
  return passages
    .map(
      (p, i) =>
        `[Passage ${i + 1}] (Material: "${p.material_title}"${p.page_number ? `, Page ${p.page_number}` : ""}):\n${p.content}`
    )
    .join("\n\n---\n\n");
}

/** Generate a comprehensive Study Guide grounded in the supplied passages */
export async function generateStudyGuideFromPassages(
  notebookTitle: string,
  passages: RetrievedPassage[]
): Promise<string> {
  const context = formatPassagesContext(passages);
  const instruction = `You are StudyLens Studio, an academic synthesizer. Create an in-depth, structured markdown Study Guide for the notebook "${notebookTitle}" using ONLY the provided source passages.
Structure the study guide with:
# Comprehensive Study Guide: ${notebookTitle}
### 1. Executive Summary & Core Objectives
### 2. High-Yield Topics & Conceptual Frameworks (with bullet points and definitions)
### 3. Detailed Algorithmic / Technical Explanations (include math formulas or complexity if present)
### 4. Practice Checkpoints & Self-Assessment Questions
Do not invent information. Format clearly with markdown headers, bold terms, and lists.`;

  const prompt = `Source Evidence Passages:\n\n${context}\n\nPlease generate the comprehensive study guide:`;
  return generateTextCompletion(instruction, prompt);
}

/** Generate FAQ and core concept Q&A pairs grounded in the supplied passages */
export async function generateFAQFromPassages(
  notebookTitle: string,
  passages: RetrievedPassage[]
): Promise<string> {
  const context = formatPassagesContext(passages);
  const instruction = `You are StudyLens Studio. Generate 4 to 6 high-yield Frequently Asked Questions (FAQs) with detailed, factual answers strictly derived from the provided source passages for "${notebookTitle}". Return valid JSON matching the schema.`;

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "items"],
    additionalProperties: false,
  };

  const prompt = `Source Evidence Passages:\n\n${context}`;
  const res = await generateStructuredCompletion(instruction, prompt, schema, faqResponseSchema);

  let md = `# Frequently Asked Questions & Core Concepts: ${notebookTitle}\n\n`;
  for (const item of res.items) {
    md += `### Q: ${item.question}\n\n${item.answer}\n\n`;
  }
  return md;
}

/** Generate a Quick Review Cheat Sheet with tabular summaries */
export async function generateCheatSheetFromPassages(
  notebookTitle: string,
  passages: RetrievedPassage[]
): Promise<string> {
  const context = formatPassagesContext(passages);
  const instruction = `You are StudyLens Studio. Generate a high-yield Cheat Sheet and comparison reference table based strictly on the provided study passages for "${notebookTitle}". Return valid JSON matching the schema.`;

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            concept: { type: "string" },
            summaryOrComplexity: { type: "string" },
            keyTakeaway: { type: "string" },
          },
          required: ["concept", "summaryOrComplexity", "keyTakeaway"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "items"],
    additionalProperties: false,
  };

  const prompt = `Source Evidence Passages:\n\n${context}`;
  const res = await generateStructuredCompletion(instruction, prompt, schema, cheatSheetResponseSchema);

  let md = `# Quick Reference Cheat Sheet: ${notebookTitle}\n\n`;
  md += `| Concept / Topic | Summary / Complexity | Key Takeaway |\n`;
  md += `| :--- | :--- | :--- |\n`;
  for (const item of res.items) {
    md += `| **${item.concept.replace(/\|/g, "/")}** | ${item.summaryOrComplexity.replace(/\|/g, "/")} | ${item.keyTakeaway.replace(/\|/g, "/")} |\n`;
  }
  return md;
}

/** Generate a 2-host conversational Deep Dive Podcast dialogue */
export async function generateAudioOverviewFromPassages(
  notebookTitle: string,
  passages: RetrievedPassage[]
): Promise<PodcastScript> {
  const context = formatPassagesContext(passages);
  const instruction = `You are StudyLens Studio. Create an engaging 2-speaker podcast dialogue between co-hosts Alex (analytical, inquisitive) and Sam (clear, enthusiastic explainer) discussing the core ideas in "${notebookTitle}" based ONLY on the provided source passages.
Make the conversation natural, educational, dynamic, and easy to listen to. Keep each line concise (1-3 sentences). Return JSON matching the schema.`;

  const schema = {
    type: "object",
    properties: {
      episodeTitle: { type: "string" },
      overview: { type: "string" },
      dialogue: {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: { type: "string", enum: ["Alex", "Sam"] },
            line: { type: "string" },
          },
          required: ["speaker", "line"],
          additionalProperties: false,
        },
      },
    },
    required: ["episodeTitle", "overview", "dialogue"],
    additionalProperties: false,
  };

  const prompt = `Source Evidence Passages:\n\n${context}`;
  return generateStructuredCompletion(instruction, prompt, schema, podcastScriptSchema);
}
