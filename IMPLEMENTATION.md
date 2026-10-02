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
3. **Accounts and storage — planned:** Supabase email/password authentication, private materials, and ownership rules.
4. **Ingestion and retrieval — planned:** PDF, OCR, text, Markdown, embeddings, and vector search.
5. **Grounded chat and citations — planned:** evidence checks, Gemini answers, OpenAI fallback, and source-linked responses.
6. **Study tools and channels — planned:** YouTube transcripts, source-backed quizzes, and on-demand Telegram integration.

Use Bun for local development and verification. Follow the installed Next.js 16 documentation before changing framework behavior. Do not run a production build unless requested.
