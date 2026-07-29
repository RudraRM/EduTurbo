"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { getSupabaseBrowser } from "@/lib/supabase/client";

export function useUser() {
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
    staleTime: 5 * 60_000,
  });

  return { user: data ?? null, isLoading };
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    queryClient.clear();
    router.push("/login");
    router.refresh();
  };
}
