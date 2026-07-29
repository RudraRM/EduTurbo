import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SharedNote } from "./shared-note";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: { id: string };
}

async function fetchSharedNote(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey);

  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, is_public, updated_at")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (!doc) return null;

  const { data: note } = await supabase
    .from("notes")
    .select("content_html")
    .eq("document_id", id)
    .maybeSingle();

  return { doc, note };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const shared = await fetchSharedNote(params.id);
  return {
    title: shared ? `${shared.doc.title} — shared note` : "Shared note",
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const shared = await fetchSharedNote(params.id);
  if (!shared) notFound();

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-20 border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <Button size="sm" asChild>
            <Link href="/signup">Try Lumen free</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Shared note · updated{" "}
          {new Date(shared.doc.updated_at).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="mt-6">
          <SharedNote html={shared.note?.content_html ?? "<p>This note is empty.</p>"} />
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Made with{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Lumen
        </Link>{" "}
        — turn anything into knowledge.
      </footer>
    </div>
  );
}
