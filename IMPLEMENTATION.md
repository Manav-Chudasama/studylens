# StudyLens implementation phases

1. **Foundation UI — complete:** responsive library, chat, and source viewer shell using the approved layout.
2. **Component UI — complete:** Nexus Thread, Message, Prompt Input, Attachments, Citation, Suggestions, and Tool components integrated with typed study data. Added upload, quiz, email/password auth, and account/Telegram surfaces. The current home page uses sample data and optional backend callbacks.
3. **Accounts and storage — planned:** Supabase email/password authentication, private materials, and ownership rules.
4. **Ingestion and retrieval — planned:** PDF, OCR, text, Markdown, embeddings, and vector search.
5. **Grounded chat and citations — planned:** evidence checks, Gemini answers, OpenAI fallback, and source-linked responses.
6. **Study tools and channels — planned:** YouTube transcripts, source-backed quizzes, and on-demand Telegram integration.

Use Bun for local development and verification. Follow the installed Next.js 16 documentation before changing framework behavior. Do not run a production build unless requested.
