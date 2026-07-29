"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Flashcard, Quiz, QuizKind, QuizQuestion } from "@/lib/types";

export function useFlashcards(documentId: string) {
  return useQuery<Flashcard[]>({
    queryKey: ["flashcards", documentId],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("document_id", documentId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Flashcard[];
    },
    enabled: Boolean(documentId),
  });
}

export function useSaveFlashcards(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cards: { front: string; back: string }[]) => {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      // Replace the existing deck wholesale.
      await supabase.from("flashcards").delete().eq("document_id", documentId);
      const { error } = await supabase.from("flashcards").insert(
        cards.map((card, index) => ({
          document_id: documentId,
          user_id: userData.user!.id,
          front: card.front,
          back: card.back,
          position: index,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["flashcards", documentId] }),
    onError: () => toast.error("Couldn't save flashcards."),
  });
}

export function useQuizzes(documentId: string) {
  return useQuery<Quiz[]>({
    queryKey: ["quizzes", documentId],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Quiz[];
    },
    enabled: Boolean(documentId),
  });
}

export function useSaveQuiz(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kind,
      title,
      questions,
    }: {
      kind: QuizKind;
      title: string;
      questions: QuizQuestion[];
    }) => {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { error } = await supabase.from("quizzes").insert({
        document_id: documentId,
        user_id: userData.user.id,
        kind,
        title,
        questions,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] }),
    onError: () => toast.error("Couldn't save the quiz."),
  });
}

export function useDeleteQuiz(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizId: string) => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] }),
  });
}
