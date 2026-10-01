export type MaterialType = "pdf" | "note" | "video";
export type MaterialStatus = "ready" | "processing" | "failed";

export type Material = {
  id: string;
  title: string;
  type: MaterialType;
  detail: string;
  addedLabel: string;
  status: MaterialStatus;
};

export type SourceLocation =
  | { kind: "page"; page: number }
  | { kind: "section"; section: string }
  | { kind: "timestamp"; seconds: number };

export type Citation = {
  id: string;
  materialId: string;
  title: string;
  excerpt: string;
  location: SourceLocation;
};

export type StudyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  activity?: string;
};

export type StudyUser = {
  id: string;
  displayName: string;
};

export type StudyConversation = {
  id: string;
  title: string;
  updatedLabel: string;
  messages: StudyMessage[];
};

export type StudyNotebook = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
  citation: Citation;
};

export type SourcePreview = {
  heading: string;
  intro: string;
  excerpt: string;
  following: string;
};
