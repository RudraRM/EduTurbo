"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Collection, Doc, Folder } from "@/lib/types";

export function useDocuments() {
  return useQuery<Doc[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      // extracted_text is intentionally omitted — it can be tens of KB per row
      // and list views never need it (the detail query fetches everything).
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, user_id, folder_id, title, source_type, source_url, file_path, file_size, status, error_message, favorite, tags, is_public, created_at, updated_at, last_opened_at"
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });
}

export function useDocument(id: string) {
  return useQuery<Doc | null>({
    queryKey: ["documents", id],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Doc) ?? null;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Doc> & { id: string }) => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("documents")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", variables.id] });
    },
    onError: () => toast.error("Couldn't save changes. Please try again."),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Doc) => {
      const supabase = getSupabaseBrowser();
      if (doc.file_path) {
        await supabase.storage.from("documents").remove([doc.file_path]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Couldn't delete the document."),
  });
}

export function useFolders() {
  return useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Folder[];
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("folders")
        .insert({ name, color, user_id: userData.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder created");
    },
    onError: () => toast.error("Couldn't create the folder."),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from("folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: () => toast.error("Couldn't delete the folder."),
  });
}

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  collection_items: { document_id: string }[];
}

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("collections")
        .select("id, user_id, name, description, created_at, collection_items(document_id)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown as CollectionRow[]).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        document_ids: row.collection_items.map((item) => item.document_id),
      }));
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("collections")
        .insert({ name, description: description ?? null, user_id: userData.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created");
    },
    onError: () => toast.error("Couldn't create the collection."),
  });
}

export function useToggleCollectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      documentId,
      add,
    }: {
      collectionId: string;
      documentId: string;
      add: boolean;
    }) => {
      const supabase = getSupabaseBrowser();
      if (add) {
        const { error } = await supabase
          .from("collection_items")
          .insert({ collection_id: collectionId, document_id: documentId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collection_items")
          .delete()
          .eq("collection_id", collectionId)
          .eq("document_id", documentId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
    onError: () => toast.error("Couldn't update the collection."),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
    onError: () => toast.error("Couldn't delete the collection."),
  });
}
