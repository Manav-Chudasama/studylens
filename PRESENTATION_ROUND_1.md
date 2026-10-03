# 🎓 StudyLens — Presentation Round 1 Script & Pitch Guide

> **Target Pitch Duration:** 4 to 5 Minutes  
> **Format:** Adaptable for Duo (Aamir & Sudhanshu) or Solo Presentation  
> **Key Focus:** Relatable Academic Pain Point ➔ Flaws of Generic AI ➔ Grounded RAG Solution ➔ Live Interactive Demo ➔ Technical Defensibility  

---

## 📑 Slide & Speech Overview

| Time | Slide / Segment | Speaker | Core Message |
| :--- | :--- | :---: | :--- |
| **0:00 – 0:50** | **Slide 1: The 48-Hour Exam Nightmare** | Speaker 1 (Aamir) | Real academic pain: scattered slides, buried formulas, Ctrl+F failure |
| **0:50 – 1:30** | **Slide 2: Why Generic AI Fails Students** | Speaker 2 (Sudhanshu) | ChatGPT hallucinates, lacks curriculum context, has no verifiable citations |
| **1:30 – 2:30** | **Slide 3 & 4: StudyLens Architecture** | Speaker 1 (Aamir) | Multi-format ingestion, pgvector HNSW search, strict anti-hallucination RAG |
| **2:30 – 3:50** | **Live Demo: The 3-Column Experience** | Both / Lead | Real document query ➔ Clickable Citation Jump ➔ Studio Podcast Player |
| **3:50 – 4:30** | **Slide 5: Impact, Roadmap & Closing** | Speaker 2 (Sudhanshu) | YouTube transcripts, source quizzes, measurable study time saved |

---

## 🎙️ Word-for-Word Presentation Script

### 🕒 [0:00 – 0:50] Slide 1: The Problem — The 48-Hour Exam Nightmare
*(Visual: Slide showing chaotic desk with 20 browser tabs open, 200-page PDF slides, YouTube lecture playlists, and handwritten messy notes)*

**Speaker 1 (Aamir):**
> *"Good morning, respected judges and fellow innovators.*
>
> *Let's talk about a reality every single student in this room knows too well: It is 48 hours before a major semester exam.*
>
> *You are not struggling with a lack of material — in fact, you have **too much of it**. You have 150-slide professor lecture decks, 40-page textbook PDFs, fragmented handwritten notes, and 2-hour YouTube playlist links.*
>
> *When you need to understand one specific concept — say, 'How does the time complexity of Dijkstra’s algorithm change between an adjacency matrix and a min-heap?' — what do you do?*
>
> *You press `Ctrl + F`. But `Ctrl + F` is dumb. It only searches for exact keyword matches. It cannot understand algorithmic context, synthesize definitions, or connect an equation on Slide 12 to a code snippet on Slide 80.*
>
> *Students end up spending **70% of their study time simply hunting down information** instead of actually understanding it."*

---

### 🕒 [0:50 – 1:30] Slide 2: Why Generic AI Fails Students
*(Visual: Comparison graphic between Generic LLM hallucinations vs Course Curriculum)*

**Speaker 2 (Sudhanshu / Co-Presenter):**
> *"Now, you might ask: 'Why not just paste the question into ChatGPT or Claude?'*
>
> *Because for serious academics, generic AI is a minefield:*
>
> 1. ***The Hallucination Danger:*** *Generic LLMs draw from the entire open internet. If your professor teaches a specific convention, pseudocode notation, or simplified proof, generic AI often gives you an out-of-syllabus answer that costs you marks on the exam.*
> 2. ***Zero Proof or Verifiability:*** *A standard chatbot gives you a wall of text. It cannot tell you: 'This answer came from Page 14 of your syllabus notes.' You cannot cite it, and you cannot verify it.*
> 3. ***Lack of Structure:*** *Students don't study in one continuous chat thread. We study across distinct courses — Data Structures, Operating Systems, Database Management.*
>
> *Students don't need a conversational bot that guesses. They need a **grounded study assistant that only speaks the truth of their syllabus**."*

---

### 🕒 [1:30 – 2:30] Slide 3 & 4: Introducing StudyLens — Grounded RAG for Academics
*(Visual: System Architecture Diagram showing PDF/Note Ingestion ➔ pgvector HNSW ➔ Gemini 3.8 Flash ➔ Clickable Citation Badges)*

**Speaker 1 (Aamir):**
> *"That is why we built **StudyLens** — a specialized, NotebookLM-inspired study assistant built on a strictly verified Retrieval-Augmented Generation (RAG) architecture.*
>
> *Here is how StudyLens fundamentally changes the student workflow:*
>
> * **First, Subject Notebook Isolation:** Students organize their work into dedicated notebooks — Algorithms, Big Data Analytics, Machine Learning — keeping course contexts 100% segregated.
> * **Second, Multi-Format Ingestion:** You can drop in PDFs, Markdown writeups, or paste lecture notes. We parse text while preserving **exact page boundaries** using a sliding-window chunking algorithm.
> * **Third, Vector Similarity with pgvector:** Passages are embedded into 1,536-dimensional vectors using Google Gemini and OpenAI models and indexed in PostgreSQL using an HNSW cosine similarity index.
> * **And most importantly, Strict Anti-Hallucination Grounding:** When a student asks a question, our Gemini 3.8 Flash model is constrained by a strict JSON schema. Every single claim must cite an actual retrieved passage ID. If the answer is not in the student's material, **StudyLens gracefully refuses rather than fabricating an answer**.*
>
> *Let's see it in action right now."*

---

### 🕒 [2:30 – 3:50] Live Product Demonstration
*(Switch to browser at `http://localhost:3000`)*

**Lead Presenter (Screen Sharing):**

> **[Step 1: Dashboard & Workspace]**  
> *"Here is our StudyLens Dashboard. You can see isolated notebooks for our courses. Let's enter our Algorithms & DSA notebook.*
>
> *Notice our workspace layout: On the left is our **Material Library**, in the center is our **Chat Thread**, and on the right is our **Interactive Source Viewer**.*
>
> **[Step 2: Asking a Syllabus Question]**  
> *In our library, we have uploaded our lecture notes. Let's ask:*  
> **`"What is the time complexity of Breadth-First Search and why?"`**  
>
> **[Step 3: Pointing out the Citation Badges]**  
> *Notice the result: StudyLens doesn't just return text. Notice these interactive citation badges: `[Page 4]`.*  
> *(Click on the citation badge)*  
> *Watch what happens on the right: The Source Viewer immediately scrolls to Page 4 and highlights the exact passage where the professor defined the $O(V + E)$ queue traversal.*  
>
> **[Step 4: Demonstrating Anti-Hallucination]**  
> *Now, watch what happens if I ask an off-topic question:*  
> **`"What is the population of Tokyo?"`**  
> *Notice the response: 'I couldn't find enough support for an answer in this notebook's indexed materials.' It refuses to hallucinate.*
>
> **[Step 5: The AI Study Studio]**  
> *Finally, click on **Studio** in the top bar. StudyLens doesn't just answer questions — it synthesizes learning. With one click, we can generate a **Comprehensive Study Guide**, an **Exam Cheat Sheet**, or listen to our **Deep Dive Podcast**, where two AI hosts, Alex and Sam, audibly break down the material using browser speech synthesis."*

---

### 🕒 [3:50 – 4:30] Slide 5: Roadmap, Impact & Conclusion
*(Visual: Roadmap showing YouTube transcript integration, dynamic practice quizzes, and performance metrics)*

**Speaker 2 (Sudhanshu / Co-Presenter):**
> *"To wrap up, where are we heading next?*
>
> *Our team is actively rolling out two major extensions on our roadmap:*
> 1. ***Lecture Video & Playlist Ingestion:*** *Parsing YouTube lecture transcripts into timestamped vector chunks so students can click a citation and jump directly to minute 14:20 of a lecture.*
> 2. ***Dynamic Source-Backed Quizzes:*** *Generating multiple-choice practice checkpoint questions directly from uploaded materials to test recall before exams.*
>
> *StudyLens turns passive, scattered studying into active, verified mastery. We save students hours of frustration and give them answers they can actually stake their grades on.*
>
> *Thank you, and we welcome your questions!"*

---

## 🛡️ Judge Q&A Defense Cheat Sheet

### Q1: *"How do you guarantee the model does not hallucinate?"*
> **Answer (Aamir):**  
> *"We enforce grounding at two layers:*  
> *1. **Prompt Constraint:** We use Gemini 3.8 Flash with a strict JSON schema (`responseJsonSchema`) requiring output in `claims: [{ text, citationIds }]`.*  
> *2. **Programmatic Validation:** Before the response is ever saved or rendered, our `finalizeGroundedAnswer` utility cross-checks every single `citationId` against the chunk IDs returned by our pgvector similarity query. If a claim cites a non-existent passage or the model claims `supported=false`, the claims are stripped and a strict fallback refusal is returned."*

### Q2: *"Why did you use PostgreSQL with pgvector instead of a standalone vector database like Pinecone or Chroma?"*
> **Answer (Sudhanshu):**  
> *"Three reasons: First, **data co-location** — user accounts, notebooks, materials, chat messages, and vector embeddings all live in one ACID-compliant database. Second, **Row-Level Security (RLS)** — pgvector queries inherit PostgreSQL RLS, ensuring that no student's query can ever search or leak another student's embeddings. Third, **operational simplicity** — no extra microservices or cross-network latency between relational data and vector indexes."*

### Q3: *"What is your chunking strategy for long academic PDFs?"*
> **Answer (Aamir):**  
> *"We parse PDFs page-by-page using `pdfjs-dist`, retaining the exact `pageNumber` on every text segment. We then apply an overlapping sliding-window chunker with a 1,400-character window and 180-character overlap, breaking on natural sentence or word boundaries. This ensures algorithmic formulas and conceptual definitions aren't severed across chunk boundaries while preserving precise citation page tracking."*

### Q4: *"Can this scale to hundreds of students uploading 100MB textbooks?"*
> **Answer (Sudhanshu):**  
> *"Yes. Files are uploaded via chunked, resumable uploads directly to private Supabase Storage buckets, offloading bandwidth from the Next.js server. For vector indexing, our table uses an HNSW (Hierarchical Navigable Small World) index with cosine distance operator `<=>`, which provides sub-millisecond approximate nearest neighbor retrieval even at tens of thousands of chunks."*
