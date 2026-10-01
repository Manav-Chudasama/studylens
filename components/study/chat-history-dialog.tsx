"use client";

import Link from "next/link";
import { Check, MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StudyConversation } from "@/lib/study-types";

type ChatHistoryDialogProps = {
  conversations: StudyConversation[];
  isOpen: boolean;
  isSignedIn: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  selectedId?: string;
};

/** Lists the current student's saved conversations and opens a selected thread. */
export function ChatHistoryDialog({
  conversations,
  isOpen,
  isSignedIn,
  onOpenChange,
  onSelect,
  selectedId,
}: ChatHistoryDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[85svh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Previous chats</DialogTitle>
          <DialogDescription>Open a conversation from your study history.</DialogDescription>
        </DialogHeader>
        {!isSignedIn ? (
          <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-5">
            <p className="text-sm text-muted-foreground">Sign in to see your saved chats.</p>
            <Button nativeButton={false} render={<Link href="/auth/sign-in" />} size="sm">Sign in</Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center">
            <MessageSquareText aria-hidden="true" className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="font-medium">No previous chats yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your saved conversations will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[min(24rem,55svh)]">
            <div className="space-y-1 pr-3">
              {conversations.map((conversation) => (
                <Button
                  aria-current={selectedId === conversation.id ? "true" : undefined}
                  className="h-auto w-full justify-start gap-3 px-3 py-3 text-left whitespace-normal"
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  variant={selectedId === conversation.id ? "secondary" : "ghost"}
                >
                  <MessageSquareText aria-hidden="true" className="size-4 self-start" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{conversation.title}</span>
                    <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                      {conversation.updatedLabel}
                    </span>
                  </span>
                  {selectedId === conversation.id && <Check aria-hidden="true" className="size-4" />}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
