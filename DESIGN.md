# StudyLens design decisions

## Workspace layout

- The primary workspace follows the approved preview: library on the left, chat in the center, and source viewer on the right.
- At medium widths, the library remains visible and the source viewer opens as a drawer. At phone widths, both side panels open as drawers.
- The chat composer stays at the bottom of the center column. Citations open the corresponding sample source in this foundation phase.

## Visual system

- Use the semantic color tokens and font families in `app/globals.css`. Do not add hardcoded brand colors.
- Use Shadcn UI components installed through its CLI for controls and surfaces when available. Keep spacing, borders, and rounding consistent across panels.
- Show page or section context beside source excerpts. Keep citations keyboard accessible.

## Foundation state

- Materials, answer text, and source excerpts are preview content until ingestion and chat are implemented.
- Upload and message controls remain disabled until their server workflows exist.
