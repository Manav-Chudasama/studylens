"use client";

import { useState } from "react";
import {
  FileText,
  HelpCircle,
  ListOrdered,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StudyStudioProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notebookTitle?: string;
  materialCount: number;
  onGenerateContent: (title: string, content: string) => void;
};

export function StudyStudioDialog({
  isOpen,
  onOpenChange,
  notebookTitle = "Your notebook",
  materialCount,
  onGenerateContent,
}: StudyStudioProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(32);
  const [playbackSpeed, setPlaybackSpeed] = useState<"1x" | "1.25x" | "1.5x">("1x");

  function handleGenerateGuide() {
    onGenerateContent(
      `Study Guide: ${notebookTitle}`,
      `# Comprehensive Study Guide: ${notebookTitle}\n\n` +
      `*Generated from your ${materialCount} library source${materialCount === 1 ? "" : "s"}*\n\n` +
      `### 1. Executive Summary\n` +
      `This study guide distills the fundamental models, asymptotic complexities, and algorithmic foundations outlined in your study materials. Key concepts are synthesized below to accelerate review.\n\n` +
      `### 2. High-Yield Topics\n` +
      `• **Core Formulations:** Rigorous definitions and evaluation metrics used to estimate generalization error.\n` +
      `• **Algorithmic Invariants:** Traversal sequences, search frontiers, and convergence bounds.\n` +
      `• **Edge Cases:** Degenerate graphs, overfitting regimes, and numerical stability considerations.\n\n` +
      `### 3. Practice Checkpoints\n` +
      `1. Explain why held-out test sets are essential for unbiased model validation.\n` +
      `2. Compare the asymptotic runtimes of Breadth-First Search vs Depth-First Search on dense graphs.\n` +
      `3. Outline the key tradeoff between bias and variance in parameterized estimators.`
    );
    onOpenChange(false);
  }

  function handleGenerateFAQ() {
    onGenerateContent(
      `FAQ & Key Concepts: ${notebookTitle}`,
      `# Frequently Asked Questions & Core Concepts\n\n` +
      `**Q: How does the model validate unseen instances?**\n` +
      `> Held-out validation splits the corpus into training and test partitions, ensuring that empirical metrics reflect generalization rather than memorization.\n\n` +
      `**Q: What is the optimal traversal algorithm for unweighted shortest paths?**\n` +
      `> Breadth-First Search (BFS) is optimal with an asymptotic runtime of $O(V + E)$, expanding nodes layer by layer from the source vertex.\n\n` +
      `**Q: When should regularization be applied?**\n` +
      `> When sample complexity is low relative to model capacity, leading to high variance and overfitting on idiosyncratic features.`
    );
    onOpenChange(false);
  }

  function handleGenerateCheatSheet() {
    onGenerateContent(
      `Quick Review & Cheat Sheet: ${notebookTitle}`,
      `# Quick Reference Cheat Sheet: ${notebookTitle}\n\n` +
      `| Concept | Complexity / Definition | Key Note |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **BFS Traversal** | $O(V + E)$ | Queue-driven, discovers unweighted shortest paths |\n` +
      `| **DFS Traversal** | $O(V + E)$ | Stack/Recursion, detects cycles and topological orders |\n` +
      `| **Cross-Validation** | $k$-fold partitioning | Reduces estimator variance on small datasets |\n` +
      `| **Generalization Bound** | $\\epsilon \\le \\sqrt{\\frac{\\ln(2/\\delta)}{2m}}$ | VC dimension & sample efficiency |`
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Sparkles className="size-3 text-muted-foreground" /> Study Studio
            </Badge>
          </div>
          <DialogTitle className="font-heading text-xl">Study Studio & Briefing</DialogTitle>
          <DialogDescription>
            Synthesize your study materials into structured study aids or listen to a deep dive overview.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-2 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Audio Overview</TabsTrigger>
            <TabsTrigger value="guides">Study Guides & Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="border border-border bg-card">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-semibold text-foreground">Deep Dive Podcast</h4>
                      <Badge variant="outline" className="text-xs">NotebookLM Style</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Two AI co-hosts discuss and connect key ideas from {notebookTitle}.
                    </p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Volume2 className="size-5" />
                  </div>
                </div>

                {/* Audio Player Controls */}
                <div className="space-y-2 rounded-lg border border-border/80 bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{isPlayingAudio ? "01:24" : "00:00"}</span>
                    <span>04:30</span>
                  </div>
                  <Progress value={isPlayingAudio ? audioProgress : 0} className="h-1.5" />
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                      onClick={() => setAudioProgress((p) => Math.max(0, p - 15))}
                    >
                      <RotateCcw className="mr-1 size-3.5" /> -15s
                    </Button>

                    <Button
                      size="icon"
                      variant="default"
                      className="size-9 rounded-full"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    >
                      {isPlayingAudio ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs font-mono"
                      onClick={() => {
                        const speeds: ("1x" | "1.25x" | "1.5x")[] = ["1x", "1.25x", "1.5x"];
                        const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                        setPlaybackSpeed(next);
                      }}
                    >
                      {playbackSpeed}
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">🎙️ Transcript snippet:</p>
                  <p className="mt-1 italic">
                    &ldquo;Welcome back! Today we are digging into {notebookTitle}. We saw how empirical evaluation relies on held-out samples, and then we dive into why search order fundamentally alters traversal complexity...&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4 text-left hover:border-primary/50"
                onClick={handleGenerateGuide}
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Study Guide</div>
                  <div className="text-xs text-muted-foreground">Comprehensive synthesis with practice checkpoints</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4 text-left hover:border-primary/50"
                onClick={handleGenerateFAQ}
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <HelpCircle className="size-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">FAQ & Concepts</div>
                  <div className="text-xs text-muted-foreground">Key question and answer pairs from your notes</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4 text-left hover:border-primary/50"
                onClick={handleGenerateCheatSheet}
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ListOrdered className="size-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Cheat Sheet</div>
                  <div className="text-xs text-muted-foreground">Quick reference tables and formulas</div>
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
