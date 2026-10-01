"use client";

import { AlertCircle, Search, Sparkles } from "lucide-react";

import {
  Citation as NexusCitation,
  CitationContent,
  CitationTrigger,
} from "@/components/nexus-ui/citation";
import {
  Message,
  MessageContent,
  MessageMarkdown,
  MessageStack,
} from "@/components/nexus-ui/message";
import { Thread, ThreadContent, ThreadScrollToBottom } from "@/components/nexus-ui/thread";
import { Tool, ToolTrigger } from "@/components/nexus-ui/tool";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { QuizCard } from "@/components/study/quiz-card";
import { formatLocation } from "@/components/study/source-viewer";
import type { Citation, QuizQuestion, StudyMessage } from "@/lib/study-types";

export type ChatState = "idle" | "searching" | "streaming" | "error";

type ChatThreadProps = {
  messages: StudyMessage[];
  state: ChatState;
  quiz?: QuizQuestion;
  onOpenCitation: (citation: Citation) => void;
  onRetry?: () => void;
};

/** Renders a source-linked conversation using Nexus Thread and Message primitives. */
export function ChatThread({
  messages,
  state,
  quiz,
  onOpenCitation,
  onRetry,
}: ChatThreadProps) {
  return (
    <Thread className="min-h-0 flex-1 overflow-hidden">
      <ThreadContent className="mx-auto w-full max-w-3xl gap-7 px-5 py-8 sm:px-8 sm:py-10" scrollClassName="overscroll-contain">
        {messages.length === 0 && <ChatEmptyState />}
        {messages.map((message) => (
          <ChatTurn key={message.id} message={message} onOpenCitation={onOpenCitation} />
        ))}
        {state === "searching" && (
          <Tool className="max-w-xs" status="running">
            <ToolTrigger name="Searching your materials" />
          </Tool>
        )}
        {state === "streaming" && (
          <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4" /> Writing a grounded answer...
          </p>
        )}
        {state === "error" && (
          <div role="alert" className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">The answer could not be loaded.</span>
            {onRetry && <Button onClick={onRetry} size="sm" variant="outline">Retry</Button>}
          </div>
        )}
        {quiz && <QuizCard onOpenCitation={onOpenCitation} question={quiz} />}
      </ThreadContent>
      <ThreadScrollToBottom aria-label="Scroll to latest message" />
    </Thread>
  );
}

function ChatTurn({
  message,
  onOpenCitation,
}: {
  message: StudyMessage;
  onOpenCitation: (citation: Citation) => void;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <Message className="max-w-full" from={message.role}>
      {isAssistant && <MessageAvatarFallback label="StudyLens" />}
      <MessageStack className="min-w-0 flex-1">
        {message.activity && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Search className="size-3.5" /> {message.activity}
          </p>
        )}
        <MessageContent className="min-w-0">
          <MessageMarkdown>{message.content}</MessageMarkdown>
          {message.citations.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Answer sources">
              {message.citations.map((citation, index) => (
                <SourceCitation
                  citation={citation}
                  index={index + 1}
                  key={citation.id}
                  onOpen={() => onOpenCitation(citation)}
                />
              ))}
            </div>
          )}
        </MessageContent>
      </MessageStack>
      {!isAssistant && <MessageAvatarFallback label="You" />}
    </Message>
  );
}

function SourceCitation({
  citation,
  index,
  onOpen,
}: {
  citation: Citation;
  index: number;
  onOpen: () => void;
}) {
  return (
    <NexusCitation citations={[{ url: "", title: citation.title, description: citation.excerpt }]}>
      <CitationTrigger
        label={`[${index}] ${formatLocation(citation.location)}`}
        onActivate={onOpen}
        showFavicon={false}
      />
      <CitationContent>
        <div className="space-y-1 p-3 text-left text-xs">
          <p className="font-medium">{citation.title}</p>
          <p className="text-muted-foreground">{citation.excerpt}</p>
          <p className="font-medium">Open source</p>
        </div>
      </CitationContent>
    </NexusCitation>
  );
}

function MessageAvatarFallback({ label }: { label: string }) {
  return (
    <Avatar className="mt-1 size-7" size="sm">
      <AvatarFallback>{label === "You" ? "Y" : <Sparkles className="size-3.5" />}</AvatarFallback>
    </Avatar>
  );
}

function ChatEmptyState() {
  return (
    <div className="mx-auto my-16 max-w-md text-center">
      <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-muted"><Sparkles className="size-5" /></span>
      <h2 className="text-lg font-semibold">Ask your materials</h2>
      <p className="mt-2 text-sm text-muted-foreground">Upload a note or document, then ask a question. Answers will include links back to the source.</p>
    </div>
  );
}
