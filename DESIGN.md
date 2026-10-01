# StudyLens design decisions

## Workspace layout

- The primary workspace follows the approved preview: library on the left, chat in the center, and source viewer on the right.
- At medium widths, the library remains visible and the source viewer opens as a drawer. At phone widths, both side panels open as drawers.
- The chat composer stays at the bottom of the center column. Citations open the corresponding source in the desktop panel or mobile drawer.
- The workspace fits the viewport. Material rows below the library tabs, chat messages, and source content each scroll inside their own panel; their headers, controls, and composer stay in place. Prevent scroll chaining between panels.
- Desktop sidebars collapse completely so the chat gains space. Each panel has a collapse control, and an always reachable button reopens it. Keep the smaller-screen drawer behavior.
- Animate desktop sidebar track widths and panel opacity for collapse/reopen, while respecting reduced-motion preferences. Keep the panels mounted so library filters remain in place.
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
- Sign-in, sign-up, and password reset fill the viewport without an outer card: a grayscale StudyLens illustration on the left with the brand overlaid, and the form on the right at desktop sizes. On smaller screens, prioritize the form and hide the illustration. Avoid document scrolling at ordinary viewport sizes; allow panel-local overflow on unusually short screens so fields remain accessible. Use only the existing theme tokens and avoid implying unsupported sign-in providers.
