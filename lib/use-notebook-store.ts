"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";

import type { StudyNotebook } from "@/lib/study-types";

export const notebookDetailsSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(80, "Keep the title under 80 characters."),
  description: z.string().trim().max(160, "Keep the description under 160 characters."),
});

const notebookSchema = notebookDetailsSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const persistedStateSchema = z.object({
  state: z.object({ createdNotebooks: z.array(notebookSchema) }),
  version: z.number(),
});

type NotebookDetails = z.infer<typeof notebookDetailsSchema>;

type NotebookStore = {
  createdNotebooks: StudyNotebook[];
  createNotebook: (details: NotebookDetails) => string;
};

/** Browser-local notebook names for the UI phase; account storage will replace this source. */
export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set) => ({
      createdNotebooks: [],
      createNotebook: (details) => {
        const validated = notebookDetailsSchema.parse(details);
        const now = new Date().toISOString();
        const notebook: StudyNotebook = {
          id: crypto.randomUUID(),
          ...validated,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ createdNotebooks: [notebook, ...state.createdNotebooks] }));
        return notebook.id;
      },
    }),
    {
      name: "studylens-preview-notebooks",
      version: 1,
      partialize: (state) => ({ createdNotebooks: state.createdNotebooks }),
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            const stored = localStorage.getItem(name);
            if (!stored) return null;
            const result = persistedStateSchema.safeParse(JSON.parse(stored));
            return result.success && result.data.version === 1 ? JSON.stringify(result.data) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
    },
  ),
);

/** Hydrates browser-local notebooks after the server and client first render match. */
export function useNotebookHydration() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void Promise.resolve(useNotebookStore.persist.rehydrate()).finally(() => {
      if (isMounted) setHasHydrated(true);
    });
    return () => { isMounted = false; };
  }, []);

  return hasHydrated;
}
