"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BrainCircuit,
  Check,
  Copy,
  Download,
  FileWarning,
  Globe,
  Layers,
  Link2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/chat-panel";
import { NoteEditor } from "@/components/editor/note-editor";
import { MarkdownView } from "@/components/markdown-view";
import { FlashcardsView } from "@/components/study/flashcards-view";
import { QuizView } from "@/components/study/quiz-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { useNote, useSaveNote } from "@/hooks/use-note";
import { generateNotes } from "@/lib/ai/generate";
import { htmlToMarkdown } from "@/lib/markdown";
import { markdownToHtml } from "@/lib/markdown";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Doc } from "@/lib/types";
import { SOURCE_LABEL } from "@/lib/types";
import { cn, downloadFile } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

/* ────────────────────────── header pieces ────────────────────────── */

function EditableTitle({ doc }: { doc: Doc }) {
  const updateDocument = useUpdateDocument();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(doc.title);

  useEffect(() => setValue(doc.title), [doc.title]);

  function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== doc.title) {
      updateDocument.mutate({ id: doc.id, title: trimmed });
    } else {
      setValue(doc.title);
    }
  }

  if (editing) {
    return (
      <Input
        value={value}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setValue(doc.title);
            setEditing(false);
          }
        }}
        className="h-auto max-w-xl border-transparent bg-transparent px-1 py-0.5 text-xl font-bold tracking-tight shadow-none sm:text-2xl"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="truncate rounded-lg px-1 py-0.5 text-left text-xl font-bold tracking-tight transition-colors hover:bg-secondary/60 sm:text-2xl"
      title="Rename"
    >
      {doc.title}
    </button>
  );
}

function TagEditor({ doc }: { doc: Doc }) {
  const updateDocument = useUpdateDocument();
  const [draft, setDraft] = useState("");

  function addTag() {
    const tag = draft.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (!tag) return;
    if (!doc.tags.includes(tag)) {
      updateDocument.mutate({ id: doc.id, tags: [...doc.tags, tag] });
    }
    setDraft("");
  }

  function removeTag(tag: string) {
    updateDocument.mutate({ id: doc.id, tags: doc.tags.filter((t) => t !== tag) });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Tag />
          {doc.tags.length > 0 ? `${doc.tags.length} tags` : "Add tags"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <p className="text-sm font-medium">Tags</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {doc.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              #{tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {doc.tags.length === 0 && (
            <span className="text-xs text-muted-foreground">No tags yet</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addTag()}
            placeholder="e.g. biology"
            className="h-9"
          />
          <Button size="sm" className="h-9" onClick={addTag} disabled={!draft.trim()}>
            <Plus />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ShareMenu({ doc, noteHtml }: { doc: Doc; noteHtml: string }) {
  const updateDocument = useUpdateDocument();
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/share/${doc.id}` : "";

  function exportMarkdown() {
    const markdown = htmlToMarkdown(noteHtml);
    downloadFile(`${doc.title}.md`, markdown, "text/markdown");
  }

  function exportHtml() {
    const page = `<!doctype html><html><head><meta charset="utf-8"><title>${doc.title}</title></head><body style="max-width:720px;margin:2rem auto;font-family:ui-sans-serif,system-ui;line-height:1.7;padding:0 1rem">${noteHtml}</body></html>`;
    downloadFile(`${doc.title}.html`, page, "text/html");
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(htmlToMarkdown(noteHtml));
    toast.success("Markdown copied");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Export & share">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={exportMarkdown}>
          <Download />
          Download Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportHtml}>
          <Download />
          Download HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void copyMarkdown()}>
          <Copy />
          Copy as Markdown
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Public link
            </span>
            <Switch
              checked={doc.is_public}
              onCheckedChange={(checked) =>
                updateDocument.mutate({ id: doc.id, is_public: checked })
              }
              aria-label="Toggle public link"
            />
          </div>
          {doc.is_public && (
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-2 flex w-full items-center gap-1.5 truncate rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedLink ? (
                <Check className="h-3 w-3 flex-none text-emerald-500" />
              ) : (
                <Link2 className="h-3 w-3 flex-none" />
              )}
              <span className="truncate">{shareUrl}</span>
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ────────────────────────── page ────────────────────────── */

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;

  const queryClient = useQueryClient();
  const { apiKey, model } = useSettings();
  const setApiKeyDialogOpen = useUI((s) => s.setApiKeyDialogOpen);

  const { data: doc, isLoading: docLoading } = useDocument(documentId);
  const { data: note, isLoading: noteLoading } = useNote(documentId);
  const saveNote = useSaveNote(documentId);
  const updateDocument = useUpdateDocument();

  const [streamingMarkdown, setStreamingMarkdown] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);

  // Record "recently opened" once per visit.
  useEffect(() => {
    if (doc && !touchedRef.current) {
      touchedRef.current = true;
      const supabase = getSupabaseBrowser();
      void supabase
        .from("documents")
        .update({ last_opened_at: new Date().toISOString() })
        .eq("id", doc.id);
    }
  }, [doc]);

  const runGeneration = useCallback(async () => {
    if (!doc || generatingRef.current) return;
    if (!apiKey) {
      setApiKeyDialogOpen(true);
      return;
    }
    if (!doc.extracted_text?.trim()) {
      updateDocument.mutate({
        id: doc.id,
        status: "error",
        error_message: "No readable content was extracted from this source.",
      });
      return;
    }

    generatingRef.current = true;
    setStreamingMarkdown("");

    try {
      const markdown = await generateNotes(
        { apiKey, model },
        {
          title: doc.title,
          kind: SOURCE_LABEL[doc.source_type],
          text: doc.extracted_text,
        },
        (token) => {
          setStreamingMarkdown((current) => (current ?? "") + token);
        }
      );

      await saveNote.mutateAsync(markdownToHtml(markdown));
      await updateDocument.mutateAsync({ id: doc.id, status: "ready", error_message: null });
      queryClient.invalidateQueries({ queryKey: ["notes", doc.id] });
      toast.success("Notes ready ✨");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Note generation failed.");
      updateDocument.mutate({
        id: doc.id,
        status: "error",
        error_message: error instanceof Error ? error.message : "Generation failed.",
      });
    } finally {
      generatingRef.current = false;
      setStreamingMarkdown(null);
    }
  }, [doc, apiKey, model, saveNote, updateDocument, queryClient, setApiKeyDialogOpen]);

  // Auto-start generation for freshly-imported documents.
  const needsGeneration =
    doc != null &&
    !noteLoading &&
    note == null &&
    doc.status !== "error" &&
    Boolean(doc.extracted_text?.trim());

  useEffect(() => {
    if (needsGeneration && apiKey && streamingMarkdown === null) {
      void runGeneration();
    }
  }, [needsGeneration, apiKey, streamingMarkdown, runGeneration]);

  // Keep the streaming preview scrolled to the newest content.
  useEffect(() => {
    if (streamingMarkdown !== null && streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamingMarkdown]);

  const handleSaveNote = useCallback(
    (html: string) => {
      saveNote.mutate(html);
    },
    [saveNote]
  );

  if (docLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-6 h-10 w-2/3" />
        <Skeleton className="mt-6 h-10 w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <FileWarning className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Document not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or the link is wrong.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/library">Back to library</Link>
        </Button>
      </div>
    );
  }

  const material = note?.content_html
    ? htmlToMarkdown(note.content_html)
    : (doc.extracted_text ?? "");

  const isGenerating = streamingMarkdown !== null;

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-4 sm:px-6">
      {/* Header */}
      <div className="flex-none pt-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
            <Link href="/library">
              <ArrowLeft />
              Library
            </Link>
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label={doc.favorite ? "Unfavorite" : "Favorite"}
              onClick={() => updateDocument.mutate({ id: doc.id, favorite: !doc.favorite })}
            >
              <Star
                className={cn("h-4 w-4", doc.favorite && "fill-amber-400 text-amber-400")}
              />
            </Button>
            <ShareMenu doc={doc} noteHtml={note?.content_html ?? ""} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <EditableTitle doc={doc} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{SOURCE_LABEL[doc.source_type]}</Badge>
          <TagEditor doc={doc} />
          {note && !isGenerating && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => void runGeneration()}
            >
              <RefreshCw />
              Regenerate notes
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      {isGenerating ? (
        <div className="flex min-h-0 flex-1 flex-col pb-6 pt-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-none items-center gap-2.5 rounded-2xl border border-primary/20 bg-accent/50 px-4 py-3 text-sm font-medium text-accent-foreground"
          >
            <Sparkles className="h-4 w-4 animate-pulse-soft" />
            Writing your notes…
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          </motion.div>
          <div
            ref={streamRef}
            className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border bg-card p-6 shadow-soft sm:p-8"
          >
            {streamingMarkdown ? (
              <MarkdownView content={streamingMarkdown} />
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
          </div>
        </div>
      ) : needsGeneration && !apiKey ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent">
            <Sparkles className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Ready to generate your notes</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Connect your free Groq API key and Lumen will turn this{" "}
            {SOURCE_LABEL[doc.source_type]} into beautiful study notes.
          </p>
          <Button className="mt-6" onClick={() => setApiKeyDialogOpen(true)}>
            Connect Groq key
          </Button>
        </div>
      ) : doc.status === "error" && !note ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10">
            <FileWarning className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {doc.error_message ?? "We couldn't process this document."}
          </p>
          <Button className="mt-6" onClick={() => void runGeneration()}>
            <RefreshCw />
            Try again
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="notes" className="flex min-h-0 flex-1 flex-col pt-4">
          <TabsList className="w-full flex-none justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="notes">
              <NotebookPen />
              Notes
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle />
              Chat
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Layers />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="quiz">
              <BrainCircuit />
              Quizzes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="min-h-0 flex-1 overflow-y-auto pb-10">
            {noteLoading ? (
              <div className="space-y-3 pt-6">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <NoteEditor
                key={note?.id ?? "empty"}
                initialHtml={note?.content_html ?? ""}
                onSave={handleSaveNote}
                saving={saveNote.isPending}
              />
            )}
          </TabsContent>

          <TabsContent value="chat" className="min-h-0 flex-1 pb-4">
            <ChatPanel doc={doc} noteHtml={note?.content_html ?? ""} />
          </TabsContent>

          <TabsContent value="cards" className="min-h-0 flex-1 overflow-y-auto pb-10">
            <FlashcardsView doc={doc} material={material} />
          </TabsContent>

          <TabsContent value="quiz" className="min-h-0 flex-1 overflow-y-auto pb-10">
            <QuizView doc={doc} material={material} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
