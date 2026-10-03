# StudyLens implementation phases

1. **Foundation UI — complete:** responsive library, chat, and source viewer shell using the approved layout.
2. **Component UI — complete:** Nexus Thread, Message, Prompt Input, Attachments, Citation, Suggestions, and Tool components integrated with typed study data. Added upload, quiz, email/password auth, and account/Telegram surfaces. The current home page uses sample data and optional backend callbacks.
   - Workspace scroll regions: library materials, chat messages, and source content now scroll independently within a viewport-height layout on desktop and in drawers on smaller screens.
   - Desktop library and source sidebars can collapse independently; their space returns to chat and visible controls reopen them. Tablet and phone layouts retain drawers.
   - Sidebar width changes now animate with a reduced-motion fallback. Reworked email/password account screens into a responsive split layout based on the StudyLens answer flow.
   - The account layout now fills the viewport without a surrounding card or page scrollbar; short viewports can scroll the form panel independently.
   - Replaced the auth preview content with an optimized grayscale study illustration shared by sign-in, sign-up, and password reset.
   - Removed the workspace preview badge. Guests see Sign in instead of a profile avatar; the chat header opens a saved-conversation dialog with guest and empty states, and selecting a supplied conversation swaps the visible messages.
   - Added a notebook dashboard at `/dashboard` with search, recent cards, and a validated create dialog. Notebook cards open `/notebooks/[id]`; each workspace receives only that notebook's sample materials and chats. New notebook names persist locally for the UI phase and open an empty workspace. The populated Algorithms & DSA notebook previews signed-in chat history.
   - Set the root route `/` to display the Notebook Dashboard, linking directly into individual study workspaces.
   - Upgraded desktop workspace to draggable, adjustable sidebars via Shadcn Resizable panels (`ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle withHandle`).
   - Streamlined workspace layout inspired by Google Gemini NotebookLM: moved notebook breadcrumbs and contextual controls (`History`, `Practice`, `Source viewer`, `Sign in`) into the top header, eliminating the inner chat banner to grant the conversation thread 100% vertical viewport height.
   - Resolved `react-resizable-panels` v4 unknown property console warnings (`onExpand`, `onCollapse`) by tracking panel state dynamically via `onResize` and panel refs. Added prominent pop-back action buttons below the header in the top-left (Library) and top-right (Source viewer) whenever sidebars are collapsed.
   - Consolidated all test suites into a dedicated `tests/` directory (`tests/notebook-fixtures.test.ts`, `tests/study-workspace.test.tsx`, `tests/study-ui.test.tsx`) executed via Bun Test Runner.
   - Added notebook card management options: three-dot dropdown menu supporting real-time notebook renaming and deletion with confirmation modal.
   - Added workspace top-bar study controls: "New chat" button to instantly reset the conversation thread, "Studio" dialog with study guide generation and interactive Audio Overview podcast player, "Share" dialog with read-only link copying and Markdown (.md) / plain text transcript export, and a persistent dark/light mode toggle.
   - Added message action bar on assistant responses: one-click copy to clipboard with checkmark feedback, response rating (thumbs up/down), and answer regeneration.
   - Added material removal action to the Library sidebar with hover controls.
3. **Accounts and storage — auth and notebook storage implemented:**
   - Installed `@supabase/ssr` and `@supabase/supabase-js`; added request-scoped server/browser clients and a Next.js 16 Proxy for cookie session refresh.
   - Connected sign-up, sign-in, email confirmation callback, password reset request, password update, and sign-out. Server actions validate inputs with Zod and verify identity before password changes.
   - Protected the dashboard and notebook routes with server-side JWT checks. Notebook create, edit, and delete operations verify the user and rely on owner-scoped queries plus RLS.
   - Replaced the sample signed-in identity and browser-local notebook source in the active dashboard/workspace with account data. Existing browser-local preview notebook names remain in local storage but are not automatically assigned to an account.
   - Applied `supabase/migrations/20261002142432_create_notebooks.sql` to the StudyLens Supabase project. Verified the table, RLS, and owner-only SELECT/INSERT/UPDATE/DELETE policies. The remote migration version matches the local filename.
   - **Setup required:** copy `.env.example` values into a local `.env.local` without committing it; set `NEXT_PUBLIC_SITE_URL` to the deployed app origin outside local development. In Supabase Auth URL Configuration, allow `http://localhost:3000/auth/callback` and the corresponding deployment callback URL. Confirm signup and recovery email templates must return a PKCE `code` or `token_hash` to `/auth/callback`. Configure production SMTP before public use.
   - Verified `bun x --bun tsc --noEmit`, full-project ESLint (`bun run lint`), and all 14 Bun tests pass with zero errors and zero warnings. Resolved the `theme-toggle.tsx` effect warning by migrating to `useSyncExternalStore`.
4. **Material upload — storage implemented; retrieval planned:**
   - Applied `supabase/migrations/20261002150123_create_materials.sql`: owner-scoped material rows, private `study-materials` bucket, and storage policies tied to the material owner and path. The remote migration version matches the local filename.
   - The notebook Upload material dialog now saves pasted notes and uploads PDF, TXT, and Markdown files (up to 20 MB each, 10 per selection). Files use chunked resumable uploads directly to Storage; server actions verify notebook ownership, reserve a path, verify uploaded size, and mark the row ready.
   - The library loads saved materials on page entry, allows deletion, and the source viewer displays pasted/text content or a private PDF preview. Notebook cards show material counts. Deleting a notebook removes its stored files.
   - YouTube stays disabled until transcript support exists. Signed-in notebook chat and studio sample responses are disabled until retrieval can produce grounded answers.
   - Static verification: TypeScript and ESLint passed. Per user request, the upload feature was not exercised; manual test steps are provided separately.
   - Still planned: PDF text extraction, OCR, embeddings, vector search, and source-linked retrieval.
5. **Grounded chat and citations — complete:**
   - Text extraction for PDFs with in-memory `pdfjs-dist` legacy worker, and plain text/note ingestion.
   - Vector embeddings using Google Gemini's `gemini-embedding-001` (1536-dimensional) stored in PostgreSQL with `pgvector` HNSW cosine indexing.
   - Grounded RAG answer generation with Google Gemini (`gemini-3.8-flash`) enforcing strict JSON schema and verified source citations.
   - Conversational intelligence: library catalog awareness, meta-query handling ("what docs do u see?"), multi-document summary synthesis ("Summarize my materials"), contextual greetings, and intelligent fallback synthesis.
6. **Study tools and channels — planned:** YouTube transcripts, source-backed quizzes, and on-demand Telegram integration.

Use Bun for local development and verification. Follow the installed Next.js 16 documentation before changing framework behavior. Do not run a production build unless requested.
