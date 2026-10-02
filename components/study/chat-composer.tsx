"use client";

import { useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";

import {
  Attachment,
  AttachmentList,
  AttachmentTrigger,
  Attachments,
  type AttachmentMeta,
} from "@/components/nexus-ui/attachments";
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";
import { Suggestion, SuggestionList, Suggestions } from "@/components/nexus-ui/suggestions";
import { Button } from "@/components/ui/button";

export type ChatSubmission = { text: string; files: File[] };

type ChatComposerProps = {
  isBusy?: boolean;
  onSend?: (submission: ChatSubmission) => Promise<void>;
  allowAttachments?: boolean;
};

/** Collects a question and optional files for the future chat endpoint. */
export function ChatComposer({ isBusy = false, onSend, allowAttachments = true }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [error, setError] = useState("");
  const canSend = Boolean(onSend && draft.trim() && !isBusy);

  async function submit(value: string) {
    if (!onSend || !value.trim() || isBusy) return;
    setError("");
    try {
      const files = attachments.flatMap((attachment) => attachment.data instanceof File ? [attachment.data] : []);
      await onSend({ text: value.trim(), files });
      setDraft("");
      setAttachments([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your question could not be sent. Try again.");
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-background p-4 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-4xl">
        <Suggestions className="mb-3" onSelect={setDraft}>
          <SuggestionList className="justify-start">
            <Suggestion value="Summarize my materials">Summarize my materials</Suggestion>
            <Suggestion value="Quiz me on graph traversal">Quiz me on graph traversal</Suggestion>
          </SuggestionList>
        </Suggestions>
        <Attachments
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          attachments={attachments}
          maxFiles={5}
          maxSize={20 * 1024 * 1024}
          onAttachmentsChange={setAttachments}
          onFilesRejected={() => setError("Choose PDF, TXT, or Markdown files under 20 MB each.")}
        >
          <PromptInput onSubmit={submit}>
            <PromptInputTextarea
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a question about your materials..."
              value={draft}
            />
            {attachments.length > 0 && (
              <AttachmentList className="justify-start px-3 pb-2">
                {attachments.map((attachment, index) => (
                  <Attachment
                    attachment={attachment}
                    key={`${attachment.name}-${index}`}
                    onRemove={() => {
                      setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    }}
                    variant="compact"
                  />
                ))}
              </AttachmentList>
            )}
            <PromptInputActions>
              {allowAttachments && <AttachmentTrigger asChild><Button aria-label="Attach material" size="icon" type="button" variant="ghost"><Paperclip /></Button></AttachmentTrigger>}
              <Button aria-label="Send message" disabled={!canSend} onClick={() => submit(draft)} size="icon" type="button"><ArrowUp /></Button>
            </PromptInputActions>
          </PromptInput>
        </Attachments>
        <p aria-live="polite" className="mt-2 text-center text-xs text-muted-foreground">
          {error || (!onSend ? "Chat will be available when the backend is connected." : "Answers are based on your library.")}
        </p>
      </div>
    </div>
  );
}
