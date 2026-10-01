# StudyLens design decisions

## Workspace layout

- The primary workspace follows the approved preview: library on the left, chat in the center, and source viewer on the right.
- At medium widths, the library remains visible and the source viewer opens as a drawer. At phone widths, both side panels open as drawers.
- The chat composer stays at the bottom of the center column. Citations open the corresponding source in the desktop panel or mobile drawer.

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
