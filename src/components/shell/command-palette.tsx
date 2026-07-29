"use client";

import { FileText, Plus, Search, Settings, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDocuments } from "@/hooks/use-documents";
import { SOURCE_LABEL } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { useUI } from "@/stores/ui-store";

interface Entry {
  id: string;
  title: string;
  hint: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen, setUploadOpen } = useUI();
  const { data: documents } = useDocuments();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(!commandOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, setCommandOpen]);

  useEffect(() => {
    if (!commandOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [commandOpen]);

  const entries = useMemo<Entry[]>(() => {
    const lower = query.trim().toLowerCase();

    const actions: Entry[] = [
      {
        id: "action-upload",
        title: "New document",
        hint: "Upload or import",
        icon: <Plus className="h-4 w-4 text-primary" />,
        action: () => setUploadOpen(true),
      },
      {
        id: "action-favorites",
        title: "Favorites",
        hint: "View starred documents",
        icon: <Star className="h-4 w-4 text-amber-500" />,
        action: () => router.push("/library?filter=favorites"),
      },
      {
        id: "action-settings",
        title: "Settings",
        hint: "API key, model, account",
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
        action: () => router.push("/settings"),
      },
    ].filter(
      (action) => !lower || action.title.toLowerCase().includes(lower)
    );

    const docs: Entry[] = (documents ?? [])
      .filter(
        (doc) =>
          !lower ||
          doc.title.toLowerCase().includes(lower) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(lower))
      )
      .slice(0, 8)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        hint: `${SOURCE_LABEL[doc.source_type]} · ${timeAgo(doc.updated_at)}`,
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        action: () => router.push(`/doc/${doc.id}`),
      }));

    return [...docs, ...actions];
  }, [documents, query, router, setUploadOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function run(entry: Entry) {
    setCommandOpen(false);
    entry.action();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, entries.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && entries[activeIndex]) {
      event.preventDefault();
      run(entries[activeIndex]);
    }
  }

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent hideClose className="top-[20%] max-w-xl translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 flex-none text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search documents, tags, actions…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
          />
        </div>
        <ul
          id="command-results"
          ref={listRef}
          role="listbox"
          className="max-h-80 overflow-y-auto p-2"
        >
          {entries.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing found for &ldquo;{query}&rdquo;
            </li>
          )}
          {entries.map((entry, index) => (
            <li key={entry.id} data-index={index} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onClick={() => run(entry)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                  index === activeIndex && "bg-secondary"
                )}
              >
                {entry.icon}
                <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                <span className="flex-none text-xs text-muted-foreground">{entry.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
