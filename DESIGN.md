# StudyLens design decisions

## Workspace layout

- Signed-in study starts on a notebook dashboard. Cards lead to notebook-specific workspaces; the dashboard offers search and notebook creation. Keep the dashboard's section and card layout inspired by the supplied reference while using the project's semantic monochrome theme.
- A notebook owns its materials, source previews, conversations, and practice content. Workspace breadcrumbs return to the notebook dashboard. A new notebook opens with empty library, chat, and source states.
- The primary workspace follows the approved preview: library on the left, chat in the center, and source viewer on the right.
- On desktop, sidebars are draggable and adjustable using Shadcn resizable panels (`ResizablePanelGroup`, `ResizablePanel`, and `ResizableHandle withHandle`). The student can freely adjust library and source viewer widths to prevent congestion. Sidebars remain collapsible to 0% width, returning full space to the chat. When either sidebar is collapsed, prominent actionable pop-back buttons float below the header in the top-left (to reopen Library) and top-right (to reopen Source viewer).
- Workspace header inspired by Gemini NotebookLM: the global top header hosts the notebook title, breadcrumb navigation, and study controls (History, Practice, Source viewer toggle, Account / Sign in). Redundant banners inside the chat column are eliminated so the conversation thread starts immediately at the top with maximum vertical height.
- At tablet and phone widths, both side panels open as accessible drawers (`Sheet`), giving the full screen to the chat thread and composer.
- The chat composer stays pinned at the bottom of the center column. Citations open the corresponding source in the desktop panel or mobile drawer.
- The workspace fits the viewport. Material rows below the library tabs, chat messages, and source content each scroll inside their own panel; their headers, controls, and composer stay in place. Prevent scroll chaining between panels.
- Keep the workspace header free of preview labels. Show a Sign in action to guests and an account avatar only when a viewer is supplied. Place the chat history icon beside Practice; its dialog lists only the current viewer's conversations, with sign-in and empty states when appropriate.

## Visual system

- Use the semantic color tokens and font families in `app/globals.css`. Do not add hardcoded brand colors.
- Use Shadcn UI components installed through its CLI for controls and surfaces when available. Keep spacing, borders, and rounding consistent across panels.
- Use Nexus UI for the thread, messages, prompt input, attachments, citations, suggestions, and activity states. Its copied components may need small compatibility changes because this project uses Base UI Shadcn components.
- Show page or section context beside source excerpts. Keep citations keyboard accessible.
- Use a source-backed quiz card for graded practice. Nexus Questions is reserved for clarification prompts, not answer grading.

## UI and backend boundary

- The home page uses typed sample data until ingestion and chat are implemented. Data is kept in `lib/study-fixtures.ts`; shared interfaces are in `lib/study-types.ts`.
- Upload, chat send, account actions, and Telegram linking accept optional callbacks. When absent, the UI states clearly that the backend is not connected and does not claim success.
- Authentication screens use email and password. The account dialog leads to sign-in and sign-up and includes an on-demand Telegram connection area.
- The workspace accepts a viewer and saved conversations as props for future backend wiring. Selecting a history item switches the visible thread and clears stale citation and practice state; the parent remains responsible for fetching only that viewer's data.
- Until authentication and database storage are connected, `/dashboard` and notebook routes use a sample signed-in viewer. Newly created notebook names are stored in this browser with validated Zustand persistence; the UI says this local storage is temporary. Never treat this sample viewer or browser storage as account authorization.
- Sign-in, sign-up, and password reset fill the viewport without an outer card: a grayscale StudyLens illustration on the left with the brand overlaid, and the form on the right at desktop sizes. On smaller screens, prioritize the form and hide the illustration. Avoid document scrolling at ordinary viewport sizes; allow panel-local overflow on unusually short screens so fields remain accessible. Use only the existing theme tokens and avoid implying unsupported sign-in providers.
