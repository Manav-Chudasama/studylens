# StudyLens

StudyLens is a student study assistant UI for asking questions about uploaded material. The current milestone provides the responsive interface and typed connections for later auth, upload, retrieval, chat, quiz, and Telegram services.

## Run locally

```bash
bun install
bun dev
```

Open `http://localhost:3000`. Use `bun run lint`, `bun x tsc --noEmit`, and `bun test` to verify the UI. A production build is not part of the normal verification workflow for this repository.

## Current UI

- `/` — study workspace with sample materials, Nexus chat components, source navigation, upload dialog, practice question, and account/Telegram dialog.
- `/auth/sign-in`, `/auth/sign-up`, `/auth/reset-password`, `/auth/verify` — account screens ready for the Supabase auth phase.

Sample materials and answers are **preview content**. Upload, message sending, auth submission, and Telegram linking are not connected to a backend yet. The workspace accepts typed data and optional callbacks so these services can be added without replacing the UI.

See `DESIGN.md` for interface decisions and `IMPLEMENTATION.md` for phase status.
