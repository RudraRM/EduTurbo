"use client";

import {
  Clock,
  FolderOpen,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import {
  DocumentCard,
  DocumentCardSkeleton,
} from "@/components/documents/document-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useDocuments,
  useFolders,
} from "@/hooks/use-documents";
import { cn } from "@/lib/utils";
import { useUI } from "@/stores/ui-store";

function NewCollectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCollection = useCreateCollection();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createCollection.mutate(
      { name: trimmed, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Curate documents across folders — like a playlist for studying.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="e.g. Finals week"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={!name.trim() || createCollection.isPending}
            className="w-full"
          >
            Create collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: documents, isLoading } = useDocuments();
  const { data: folders } = useFolders();
  const { data: collections } = useCollections();
  const deleteCollection = useDeleteCollection();
  const setUploadOpen = useUI((s) => s.setUploadOpen);

  const [query, setQuery] = useState("");
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);

  const filter = searchParams.get("filter"); // favorites | recent
  const folderId = searchParams.get("folder");
  const tag = searchParams.get("tag");
  const collectionId = searchParams.get("collection");

  const activeFolder = folders?.find((f) => f.id === folderId);
  const activeCollection = collections?.find((c) => c.id === collectionId);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const doc of documents ?? []) doc.tags.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    let list = documents ?? [];
    if (filter === "favorites") list = list.filter((d) => d.favorite);
    if (filter === "recent") {
      list = [...list]
        .filter((d) => d.last_opened_at)
        .sort(
          (a, b) =>
            new Date(b.last_opened_at!).getTime() - new Date(a.last_opened_at!).getTime()
        );
    }
    if (folderId) list = list.filter((d) => d.folder_id === folderId);
    if (tag) list = list.filter((d) => d.tags.includes(tag));
    if (collectionId && activeCollection) {
      list = list.filter((d) => activeCollection.document_ids.includes(d.id));
    }
    const lower = query.trim().toLowerCase();
    if (lower) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(lower) ||
          d.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    return list;
  }, [documents, filter, folderId, tag, collectionId, activeCollection, query]);

  const heading = activeCollection
    ? activeCollection.name
    : activeFolder
      ? activeFolder.name
      : filter === "favorites"
        ? "Favorites"
        : filter === "recent"
          ? "Recently opened"
          : "Library";

  const pills = [
    { label: "All", icon: LayoutGrid, href: "/library", active: !filter && !folderId && !tag && !collectionId },
    { label: "Favorites", icon: Star, href: "/library?filter=favorites", active: filter === "favorites" },
    { label: "Recent", icon: Clock, href: "/library?filter=recent", active: filter === "recent" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus />
          New document
        </Button>
      </div>

      {/* Search + filter pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or tag…"
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {pills.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => router.push(pill.href)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                pill.active
                  ? "border-transparent bg-foreground text-background"
                  : "bg-card text-muted-foreground shadow-soft hover:text-foreground"
              )}
            >
              <pill.icon className="h-3.5 w-3.5" />
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => router.push(tag === t ? "/library" : `/library?tag=${encodeURIComponent(t)}`)}
            >
              <Badge variant={tag === t ? "default" : "secondary"} className="cursor-pointer">
                #{t}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Collections rail */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            <Layers className="h-4 w-4" />
            Collections
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCollectionDialogOpen(true)}>
            <Plus />
            New
          </Button>
        </div>
        {(collections ?? []).length > 0 ? (
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
            {(collections ?? []).map((collection) => (
              <div
                key={collection.id}
                className={cn(
                  "group relative w-56 flex-none cursor-pointer rounded-2xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised",
                  collectionId === collection.id && "border-primary/50 shadow-glow"
                )}
                role="button"
                tabIndex={0}
                onClick={() =>
                  router.push(
                    collectionId === collection.id
                      ? "/library"
                      : `/library?collection=${collection.id}`
                  )
                }
                onKeyDown={(event) =>
                  event.key === "Enter" &&
                  router.push(`/library?collection=${collection.id}`)
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--pastel-violet))]">
                  <Layers className="h-4 w-4 text-foreground/70" />
                </div>
                <p className="mt-3 truncate font-semibold">{collection.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {collection.document_ids.length}{" "}
                  {collection.document_ids.length === 1 ? "document" : "documents"}
                </p>
                <button
                  type="button"
                  aria-label={`Delete collection ${collection.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteCollection.mutate(collection.id);
                  }}
                  className="absolute right-3 top-3 hidden rounded-md p-1 text-muted-foreground hover:text-destructive group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Group documents across folders — like playlists for studying.
          </p>
        )}
      </div>

      {/* Documents grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <DocumentCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={query || tag || filter || folderId || collectionId ? Search : FolderOpen}
            title={
              query
                ? `No results for “${query}”`
                : filter === "favorites"
                  ? "Nothing starred yet"
                  : "Nothing here yet"
            }
            description={
              query
                ? "Try a different search, or check another folder."
                : filter === "favorites"
                  ? "Tap the star on any document to pin it here."
                  : "Add a document and it will show up here, beautifully organized."
            }
            actionLabel={query ? undefined : "Add a document"}
            onAction={query ? undefined : () => setUploadOpen(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((doc, index) => (
              <DocumentCard key={doc.id} doc={doc} index={index} />
            ))}
          </div>
        )}
      </div>

      <NewCollectionDialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
      />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryContent />
    </Suspense>
  );
}
