"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  FileText,
  FolderInput,
  ImageIcon,
  Layers,
  Loader2,
  MonitorPlay,
  MoreHorizontal,
  Star,
  Trash2,
  Video,
  Youtube,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCollections,
  useDeleteDocument,
  useFolders,
  useToggleCollectionItem,
  useUpdateDocument,
} from "@/hooks/use-documents";
import type { Doc, SourceType } from "@/lib/types";
import { SOURCE_LABEL } from "@/lib/types";
import { cn, parseYouTubeId, timeAgo } from "@/lib/utils";

const TYPE_STYLE: Record<SourceType, { icon: React.ComponentType<{ className?: string }>; tint: string }> = {
  pdf: { icon: FileText, tint: "bg-[hsl(var(--pastel-rose))]" },
  docx: { icon: FileText, tint: "bg-[hsl(var(--pastel-sky))]" },
  pptx: { icon: MonitorPlay, tint: "bg-[hsl(var(--pastel-peach))]" },
  txt: { icon: FileText, tint: "bg-[hsl(var(--pastel-violet))]" },
  image: { icon: ImageIcon, tint: "bg-[hsl(var(--pastel-mint))]" },
  audio: { icon: AudioLines, tint: "bg-[hsl(var(--pastel-amber))]" },
  video: { icon: Video, tint: "bg-[hsl(var(--pastel-sky))]" },
  youtube: { icon: Youtube, tint: "bg-[hsl(var(--pastel-rose))]" },
};

export function DocumentCard({ doc, index = 0 }: { doc: Doc; index?: number }) {
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const toggleCollectionItem = useToggleCollectionItem();
  const { data: folders } = useFolders();
  const { data: collections } = useCollections();

  const { icon: Icon, tint } = TYPE_STYLE[doc.source_type];
  const videoId = doc.source_url ? parseYouTubeId(doc.source_url) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Link
        href={`/doc/${doc.id}`}
        className="block rounded-2.5xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-3">
          {videoId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt=""
              className="h-12 w-20 flex-none rounded-xl object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-12 w-12 flex-none items-center justify-center rounded-2xl",
                tint
              )}
            >
              <Icon className="h-6 w-6 text-foreground/70" />
            </div>
          )}
          <div className="flex flex-none items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={doc.favorite ? "Remove from favorites" : "Add to favorites"}
              className={cn(doc.favorite && "opacity-100")}
              onClick={(event) => {
                event.preventDefault();
                updateDocument.mutate({ id: doc.id, favorite: !doc.favorite });
              }}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  doc.favorite && "fill-amber-400 text-amber-400"
                )}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Document options"
                  onClick={(event) => event.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput />
                    Move to folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => updateDocument.mutate({ id: doc.id, folder_id: null })}
                    >
                      No folder
                    </DropdownMenuItem>
                    {(folders ?? []).map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() =>
                          updateDocument.mutate({ id: doc.id, folder_id: folder.id })
                        }
                      >
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Layers />
                    Collections
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(collections ?? []).length === 0 && (
                      <DropdownMenuLabel>No collections yet</DropdownMenuLabel>
                    )}
                    {(collections ?? []).map((collection) => {
                      const included = collection.document_ids.includes(doc.id);
                      return (
                        <DropdownMenuItem
                          key={collection.id}
                          onClick={() =>
                            toggleCollectionItem.mutate({
                              collectionId: collection.id,
                              documentId: doc.id,
                              add: !included,
                            })
                          }
                        >
                          {included ? "✓ " : ""}
                          {collection.name}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteDocument.mutate(doc)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="mt-4 line-clamp-2 font-semibold leading-snug">{doc.title}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{SOURCE_LABEL[doc.source_type]}</Badge>
          {doc.status === "processing" && (
            <Badge variant="warning">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </Badge>
          )}
          {doc.status === "error" && <Badge variant="destructive">Needs attention</Badge>}
          {doc.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Updated {timeAgo(doc.updated_at)}
        </p>
      </Link>
    </motion.div>
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="rounded-2.5xl border bg-card p-5 shadow-soft">
      <div className="h-12 w-12 animate-pulse-soft rounded-2xl bg-muted skeleton-shimmer" />
      <div className="mt-4 h-4 w-3/4 animate-pulse-soft rounded-md bg-muted skeleton-shimmer" />
      <div className="mt-2 h-4 w-1/2 animate-pulse-soft rounded-md bg-muted skeleton-shimmer" />
      <div className="mt-4 h-5 w-16 animate-pulse-soft rounded-full bg-muted skeleton-shimmer" />
    </div>
  );
}
