# StudyLens — Two-Person Implementation & Collaboration Plan

> **Objective:** Deliver the complete RAG-Based Student Study Assistant according to the locked problem statement by partitioning work across two independent, non-conflicting tracks on branches `aamir` and `sudhanshu`.

---

## Architecture for Zero Merge Conflicts

To avoid git merge conflicts, the codebase is partitioned into **two isolated domains** using distinct files and modular server actions:

```
┌─────────────────────────────────────────────────────────────┐
│                       StudyLens App                         │
├──────────────────────────────┬──────────────────────────────┤
│  TRACK A: Aamir (branch)     │  TRACK B: Sudhanshu (branch) │
│  Study Studio & DSA/Math     │  YouTube, Links & Quizzes    │
├──────────────────────────────┼──────────────────────────────┤
│ • AI Study Studio Syntheses  │ • YouTube Video & Playlist   │
│   (Study Guide, FAQ, Cheats) │   Transcript Ingestion       │
│ • Audio Podcast Dialogue     │ • Web Links / URL Ingestion  │
│ • DSA Code & KaTeX Math      │ • Timestamped Video Viewer   │
│ • Multi-turn Chat Tuning     │ • Dynamic Source-Backed Quiz │
│ • Studio & Rendering Tests   │ • Video & Quiz Test Suite    │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 👤 Track A: Aamir (Branch: `aamir`)
**Domain:** *AI Study Studio Syntheses, Audio Overview, DSA Code Highlighting & KaTeX Math Notation*

### Responsibilities:
1. **AI Study Studio Syntheses (Backend + UI):**
   - Create [`lib/studio-generator.ts`](file:///C:/projects/studylens/lib/studio-generator.ts) & [`app/notebooks/studio-actions.ts`](file:///C:/projects/studylens/app/notebooks/studio-actions.ts) with server actions:
     - `generateStudyGuide(notebookId)`: Comprehensive topic outline and key takeaways grounded in notebook materials.
     - `generateFAQ(notebookId)`: High-yield conceptual Q&A pairs.
     - `generateCheatSheet(notebookId)`: Concise summary tables, complexity charts, and essential formulas.
     - `generateAudioOverviewScript(notebookId)`: 2-host conversational podcast dialogue explaining the notebook.
   - Wire up [`components/study/study-studio.tsx`](file:///C:/projects/studylens/components/study/study-studio.tsx) with interactive generation triggers, loading skeletons, copy-to-clipboard, and markdown export.

2. **DSA Code Highlighting & KaTeX Math Formatting:**
   - Enhance code block rendering in [`components/nexus-ui/codeblock.tsx`](file:///C:/projects/studylens/components/nexus-ui/codeblock.tsx) with syntax highlighting for C++, Python, Java, JavaScript, and Go.
   - Ensure KaTeX / LaTeX mathematical notation ($O(n \log n)$, $O(V + E)$, recurrence relations) renders smoothly in assistant messages and study notes.
   - Polish pre-loaded "Algorithms & DSA" notebook fixtures in [`lib/notebook-fixtures.ts`](file:///C:/projects/studylens/lib/notebook-fixtures.ts) with rich tree traversal, dynamic programming, and complexity notes.

3. **Multi-Turn Chat Context Refinement & Response Actions:**
   - Refine conversation history windowing in [`app/notebooks/chat-actions.ts`](file:///C:/projects/studylens/app/notebooks/chat-actions.ts) for coherent follow-up questions while strictly enforcing passage citations.
   - Test suites: create [`tests/studio-generation.test.ts`](file:///C:/projects/studylens/tests/studio-generation.test.ts) and [`tests/dsa-math-rendering.test.ts`](file:///C:/projects/studylens/tests/dsa-math-rendering.test.ts).

### 📁 Files Owned by Aamir:
- `lib/studio-generator.ts` *(New)*
- `app/notebooks/studio-actions.ts` *(New)*
- `components/study/study-studio.tsx`
- `components/nexus-ui/codeblock.tsx`
- `lib/notebook-fixtures.ts`
- `tests/studio-generation.test.ts` *(New)*
- `tests/dsa-math-rendering.test.ts` *(New)*

---

## 👤 Track B: Sudhanshu (Branch: `sudhanshu`)
**Domain:** *YouTube Video/Playlist & Web Link Ingestion, Video Viewer Citations & Dynamic Quizzes*

### Responsibilities:
1. **YouTube & Web Link Ingestion Pipeline:**
   - Create [`lib/youtube-transcript.ts`](file:///C:/projects/studylens/lib/youtube-transcript.ts) and [`lib/web-loader.ts`](file:///C:/projects/studylens/lib/web-loader.ts) to extract transcripts with timestamps and scrape article links.
   - Extend [`lib/ingestion.ts`](file:///C:/projects/studylens/lib/ingestion.ts) to parse video cue points into timestamped chunks (e.g. `[02:15 - 03:40]`).
   - Enable the "Video URL" and "Web Link" tabs in [`components/study/material-upload.tsx`](file:///C:/projects/studylens/components/study/material-upload.tsx).
   - In [`components/study/source-viewer.tsx`](file:///C:/projects/studylens/components/study/source-viewer.tsx), render an embedded video player / transcript viewer that seeks to the exact timestamp when a video citation is clicked.

2. **Dynamic Source-Backed Quizzes & Practice Card:**
   - Create [`lib/quiz-generator.ts`](file:///C:/projects/studylens/lib/quiz-generator.ts) and [`app/notebooks/quiz-actions.ts`](file:///C:/projects/studylens/app/notebooks/quiz-actions.ts): Server action `generateNotebookQuiz(notebookId)` to generate 3–5 multiple-choice questions grounded in uploaded notebook materials.
   - Connect [`components/study/quiz-card.tsx`](file:///C:/projects/studylens/components/study/quiz-card.tsx) with interactive option selection, instant grading, explanation cards, and source links.
   - Test suites: create [`tests/youtube-ingestion.test.ts`](file:///C:/projects/studylens/tests/youtube-ingestion.test.ts) and [`tests/quiz-generation.test.ts`](file:///C:/projects/studylens/tests/quiz-generation.test.ts).

### 📁 Files Owned by Sudhanshu:
- `lib/youtube-transcript.ts` *(New)*
- `lib/web-loader.ts` *(New)*
- `lib/quiz-generator.ts` *(New)*
- `app/notebooks/quiz-actions.ts` *(New)*
- `components/study/material-upload.tsx` *(Video / Link Tabs)*
- `components/study/source-viewer.tsx` *(Video Player / Timestamp view)*
- `components/study/quiz-card.tsx`
- `tests/youtube-ingestion.test.ts` *(New)*
- `tests/quiz-generation.test.ts` *(New)*

---

## 3. Integration & Merge Step (No Conflict)

When both tracks are complete:

1. **Aamir** merges `aamir` into `main`.
2. **Sudhanshu** rebases `sudhanshu` onto `main` and merges.
3. The only integration hookup is in [`components/study/notebook-workspace.tsx`](file:///C:/projects/studylens/components/study/notebook-workspace.tsx), where:
   - Aamir plugs in `onGenerateStudio`.
   - Sudhanshu plugs in `onGenerateQuiz` and video upload callbacks.

---

## 4. Summary Matrix

| Task | Assignee | Branch | Status |
| :--- | :--- | :--- | :---: |
| **AI Study Studio Backend (Guides, FAQs, Cheats)** | Aamir | `aamir` | ⏳ Ready |
| **Audio Overview Dialogue Generator** | Aamir | `aamir` | ⏳ Ready |
| **Study Studio UI Integration** | Aamir | `aamir` | ⏳ Ready |
| **DSA Code Highlighting & KaTeX Math Notation** | Aamir | `aamir` | ⏳ Ready |
| **DSA Demo Notebook Fixture Polish** | Aamir | `aamir` | ⏳ Ready |
| **Studio & Math Test Suite** | Aamir | `aamir` | ⏳ Ready |
| **YouTube Transcript & Playlist Ingestion** | Sudhanshu | `sudhanshu` | ⏳ Ready |
| **Web Link Ingestion** | Sudhanshu | `sudhanshu` | ⏳ Ready |
| **Video Viewer & Timestamp Citations** | Sudhanshu | `sudhanshu` | ⏳ Ready |
| **Dynamic Source-Backed Quiz Engine & UI** | Sudhanshu | `sudhanshu` | ⏳ Ready |
| **Video & Quiz Test Suite** | Sudhanshu | `sudhanshu` | ⏳ Ready |
