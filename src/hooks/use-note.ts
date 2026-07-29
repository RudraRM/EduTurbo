"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Note } from "@/lib/types";

export function useNote(documentId: string) {
  return useQuery<Note | null>({
    queryKey: ["notes", documentId],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("document_id", documentId)
        .maybeSingle();
      if (error) throw error;
      return (data as Note) ?? null;
    },
    enabled: Boolean(documentId),
  });
}

export function useSaveNote(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentHtml: string) => {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { error } = await supabase.from("notes").upsert(
        {
          document_id: documentId,
          user_id: userData.user.id,
          content_html: contentHtml,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "document_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", documentId] });
    },
    onError: () => toast.error("Couldn't save the note."),
  });
}
