"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Check,
  CloudUpload,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  MonitorPlay,
  UploadCloud,
  Video,
  XCircle,
  Youtube,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACCEPT_ATTRIBUTE,
  detectSourceType,
  extractFromFile,
  fetchYouTube,
  MAX_FILE_BYTES,
} from "@/lib/extract";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { SourceType } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

type Phase = "idle" | "uploading" | "extracting" | "done" | "error";

const EXTRACT_LABEL: Record<SourceType, string> = {
  pdf: "Reading pages…",
  docx: "Reading document…",
  pptx: "Reading slides…",
  txt: "Reading text…",
  image: "Understanding the image…",
  audio: "Transcribing audio…",
  video: "Transcribing video…",
  youtube: "Fetching transcript…",
};

const TYPE_ICON: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  docx: FileText,
  pptx: MonitorPlay,
  txt: FileText,
  image: ImageIcon,
  audio: AudioLines,
  video: Video,
  youtube: Youtube,
};

const NEEDS_KEY: SourceType[] = ["image", "audio", "video"];

interface ProcessingState {
  phase: Phase;
  fileName: string;
  type: SourceType;
  error?: string;
}

function StepRow({
  label,
  state,
}: {
  label: string;
  state: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs transition-colors",
          state === "done" && "border-transparent bg-primary text-primary-foreground",
          state === "active" && "border-primary/40 text-primary",
          state === "pending" && "text-muted-foreground/50"
        )}
      >
        {state === "done" ? (
          <Check className="h-3.5 w-3.5" />
        ) : state === "active" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          "•"
        )}
      </span>
      <span
        className={cn(
          "text-sm",
          state === "active" && "font-medium text-foreground",
          state === "pending" && "text-muted-foreground/60",
          state === "done" && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function UploadDialog() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { uploadOpen, setUploadOpen, setApiKeyDialogOpen } = useUI();
  const { apiKey, model } = useSettings();
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy =
    processing !== null && processing.phase !== "error" && processing.phase !== "done";

  const reset = useCallback(() => {
    setProcessing(null);
    setYoutubeUrl("");
    setDragActive(false);
  }, []);

  function close(open: boolean) {
    if (busy) return; // don't allow closing mid-processing
    setUploadOpen(open);
    if (!open) reset();
  }

  async function createDocument(fields: {
    title: string;
    source_type: SourceType;
    source_url?: string | null;
    file_path?: string | null;
    file_size?: number | null;
    extracted_text: string;
  }): Promise<string> {
    const supabase = getSupabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("You're signed out. Sign in again.");

    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userData.user.id,
        title: fields.title,
        source_type: fields.source_type,
        source_url: fields.source_url ?? null,
        file_path: fields.file_path ?? null,
        file_size: fields.file_size ?? null,
        status: "processing",
        extracted_text: fields.extracted_text,
        tags: [],
      })
      .select("id")
      .single();

    if (error) throw new Error("Couldn't save the document. Please try again.");
    return data.id as string;
  }

  async function handleFile(file: File) {
    const type = detectSourceType(file);
    if (!type) {
      toast.error(`"${file.name}" isn't a supported format.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`Files are limited to ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    if (NEEDS_KEY.includes(type) && !apiKey) {
      setApiKeyDialogOpen(true);
      toast.info("Add your Groq key first — images, audio and video need AI to be read.");
      return;
    }

    const title = file.name.replace(/\.[^.]+$/, "");
    setProcessing({ phase: "uploading", fileName: file.name, type });

    try {
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You're signed out. Sign in again.");

      // Keep the original around for reference — extraction still succeeds
      // even if storage upload fails (e.g. bucket not created yet).
      const filePath = `${userData.user.id}/${crypto.randomUUID()}/${file.name}`;
      let storedPath: string | null = filePath;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: false });
      if (uploadError) storedPath = null;

      setProcessing({ phase: "extracting", fileName: file.name, type });
      const text = await extractFromFile(file, type, { apiKey, model });
      if (!text.trim()) {
        throw new Error(
          "No readable content found. If this is a scanned PDF, try uploading pages as images instead."
        );
      }

      const id = await createDocument({
        title,
        source_type: type,
        file_path: storedPath,
        file_size: file.size,
        extracted_text: text,
      });

      setProcessing({ phase: "done", fileName: file.name, type });
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      setTimeout(() => {
        setUploadOpen(false);
        reset();
        router.push(`/doc/${id}`);
      }, 600);
    } catch (error) {
      setProcessing({
        phase: "error",
        fileName: file.name,
        type,
        error: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  async function handleYouTube() {
    const url = youtubeUrl.trim();
    if (!url) return;

    setProcessing({ phase: "extracting", fileName: url, type: "youtube" });
    try {
      const result = await fetchYouTube(url);
      const id = await createDocument({
        title: result.title,
        source_type: "youtube",
        source_url: `https://www.youtube.com/watch?v=${result.videoId}`,
        extracted_text: result.transcript,
      });

      setProcessing({ phase: "done", fileName: result.title, type: "youtube" });
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      setTimeout(() => {
        setUploadOpen(false);
        reset();
        router.push(`/doc/${id}`);
      }, 600);
    } catch (error) {
      setProcessing({
        phase: "error",
        fileName: url,
        type: "youtube",
        error: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragActive(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const TypeIcon = processing ? TYPE_ICON[processing.type] : FileText;

  return (
    <Dialog open={uploadOpen} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add to your workspace</DialogTitle>
          <DialogDescription>
            Lumen turns it into notes, flashcards and quizzes.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {processing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-2"
            >
              <div className="flex items-center gap-3 rounded-2xl border bg-secondary/40 p-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent">
                  <TypeIcon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{processing.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {processing.phase === "error"
                      ? "Import failed"
                      : processing.phase === "done"
                        ? "Ready!"
                        : "Processing…"}
                  </p>
                </div>
              </div>

              {processing.phase === "error" ? (
                <div className="mt-5">
                  <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-sm text-destructive">
                    <XCircle className="mt-0.5 h-4 w-4 flex-none" />
                    {processing.error}
                  </div>
                  <Button variant="outline" className="mt-4 w-full" onClick={reset}>
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4 px-1">
                  {processing.type !== "youtube" && (
                    <StepRow
                      label="Uploading file"
                      state={processing.phase === "uploading" ? "active" : "done"}
                    />
                  )}
                  <StepRow
                    label={EXTRACT_LABEL[processing.type]}
                    state={
                      processing.phase === "extracting"
                        ? "active"
                        : processing.phase === "done"
                          ? "done"
                          : "pending"
                    }
                  />
                  <StepRow
                    label="Opening your document"
                    state={processing.phase === "done" ? "active" : "pending"}
                  />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="picker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Tabs defaultValue="file">
                <TabsList className="w-full">
                  <TabsTrigger value="file" className="flex-1">
                    <CloudUpload />
                    Upload file
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex-1">
                    <Youtube />
                    YouTube
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onDrop}
                    className={cn(
                      "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
                      dragActive
                        ? "border-primary bg-accent/60 shadow-glow"
                        : "hover:border-primary/40 hover:bg-secondary/40"
                    )}
                  >
                    <motion.div
                      animate={dragActive ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent"
                    >
                      <UploadCloud className="h-7 w-7 text-accent-foreground" />
                    </motion.div>
                    <p className="mt-4 text-sm font-medium">
                      {dragActive ? "Drop it here" : "Drag & drop, or click to browse"}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      PDF · Word · PowerPoint · TXT · images · audio · video — up to{" "}
                      {formatBytes(MAX_FILE_BYTES)}
                    </p>
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT_ATTRIBUTE}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void handleFile(file);
                    }}
                  />
                </TabsContent>

                <TabsContent value="youtube">
                  <div className="rounded-2xl border-2 border-dashed p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--pastel-rose))]">
                      <Youtube className="h-7 w-7 text-rose-500" />
                    </div>
                    <p className="mt-4 text-sm font-medium">Import from YouTube</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Works with any video that has captions.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="https://youtube.com/watch?v=…"
                          className="pl-9"
                          value={youtubeUrl}
                          onChange={(event) => setYoutubeUrl(event.target.value)}
                          onKeyDown={(event) =>
                            event.key === "Enter" && void handleYouTube()
                          }
                        />
                      </div>
                      <Button onClick={() => void handleYouTube()} disabled={!youtubeUrl.trim()}>
                        Import
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
