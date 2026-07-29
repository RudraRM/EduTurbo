"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { ChatMessage, ChatRole } from "@/lib/types";

export function useChatMessages(documentId: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ["chat", documentId],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
    enabled: Boolean(documentId),
  });
}

export function useSaveChatMessage(documentId: string) {
  return useMutation({
    mutationFn: async ({ role, content }: { role: ChatRole; content: string }) => {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { error } = await supabase.from("chat_messages").insert({
        document_id: documentId,
        user_id: userData.user.id,
        role,
        content,
      });
      if (error) throw error;
    },
  });
}

export function useClearChat(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("document_id", documentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", documentId] }),
  });
}
