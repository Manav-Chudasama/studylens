# StudyLens implementation phases

1. **Foundation UI — complete:** responsive library, chat, and source viewer shell using the approved layout.
2. **Component UI — complete:** Nexus Thread, Message, Prompt Input, Attachments, Citation, Suggestions, and Tool components integrated with typed study data. Added upload, quiz, email/password auth, and account/Telegram surfaces. The current home page uses sample data and optional backend callbacks.
   - Workspace scroll regions: library materials, chat messages, and source content now scroll independently within a viewport-height layout on desktop and in drawers on smaller screens.
   - Desktop library and source sidebars can collapse independently; their space returns to chat and visible controls reopen them. Tablet and phone layouts retain drawers.
   - Sidebar width changes now animate with a reduced-motion fallback. Reworked email/password account screens into a responsive split layout based on the StudyLens answer flow.
   - The account layout now fills the viewport without a surrounding card or page scrollbar; short viewports can scroll the form panel independently.
   - Replaced the auth preview content with an optimized grayscale study illustration shared by sign-in, sign-up, and password reset.
   - Removed the workspace preview badge. Guests see Sign in instead of a profile avatar; the chat header opens a saved-conversation dialog with guest and empty states, and selecting a supplied conversation swaps the visible messages.
3. **Accounts and storage — planned:** Supabase email/password authentication, private materials, and ownership rules.
4. **Ingestion and retrieval — planned:** PDF, OCR, text, Markdown, embeddings, and vector search.
5. **Grounded chat and citations — planned:** evidence checks, Gemini answers, OpenAI fallback, and source-linked responses.
6. **Study tools and channels — planned:** YouTube transcripts, source-backed quizzes, and on-demand Telegram integration.

Use Bun for local development and verification. Follow the installed Next.js 16 documentation before changing framework behavior. Do not run a production build unless requested.
