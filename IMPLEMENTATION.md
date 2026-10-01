# StudyLens implementation phases

1. **Foundation UI — complete:** responsive library, chat, and source viewer shell based on the approved layout preview. Shadcn components were added through its CLI. Sample content is marked and upload/chat controls are disabled. Desktop and phone layouts, library filtering, and source navigation were checked; lint and TypeScript pass.
2. **Accounts and storage — planned:** Supabase email/password authentication, private materials, and ownership rules.
3. **Ingestion and retrieval — planned:** PDF, OCR, text, Markdown, embeddings, and vector search.
4. **Grounded chat and citations — planned:** evidence checks, Gemini answers, OpenAI fallback, and source-linked responses.
5. **Study tools and channels — planned:** YouTube transcripts, quizzes, and on-demand Telegram integration.

Use Bun for local development and verification. Follow the installed Next.js 16 documentation before changing framework behavior. Do not run a production build unless requested.
