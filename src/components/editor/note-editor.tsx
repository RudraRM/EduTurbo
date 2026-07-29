"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { BubbleMenu, EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Check,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { runWritingAction } from "@/lib/ai/generate";
import { WRITING_ACTIONS, type WritingAction } from "@/lib/ai/prompts";
import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

interface NoteEditorProps {
  initialHtml: string;
  onSave: (html: string) => void;
  saving: boolean;
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4",
            active && "bg-accent text-accent-foreground"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Toolbar({ editor, saving }: { editor: Editor; saving: boolean }) {
  return (
    <div className="glass sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-0.5 rounded-xl border px-2 py-1.5 shadow-soft">
      <ToolbarButton
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolbarButton>
      <ToolbarButton
        label="Highlight"
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Checklist"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks />
      </ToolbarButton>
      <ToolbarButton
        label="Callout"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code />
      </ToolbarButton>
      <ToolbarButton
        label="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableIcon />
      </ToolbarButton>

      <span className="ml-auto flex items-center gap-1.5 pr-1 text-xs text-muted-foreground">
        {saving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving
          </>
        ) : (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            Saved
          </>
        )}
      </span>
    </div>
  );
}

export function NoteEditor({ initialHtml, onSave, saving }: NoteEditorProps) {
  const { apiKey, model } = useSettings();
  const setApiKeyDialogOpen = useUI((s) => s.setApiKeyDialogOpen);
  const [aiBusy, setAiBusy] = useState<WritingAction | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Highlight,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Start writing, or generate notes from your document…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "rich-text tiptap px-1 pb-24 pt-6 focus:outline-none",
        "aria-label": "Note editor",
      },
    },
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onSaveRef.current(editor.getHTML());
      }, 1200);
    },
  });

  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Flush any debounced save on unmount (e.g. switching tabs mid-edit).
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        const current = editorRef.current;
        if (current && !current.isDestroyed) {
          onSaveRef.current(current.getHTML());
        }
      }
    };
  }, []);

  const runAI = useCallback(
    async (action: WritingAction) => {
      if (!editor) return;
      if (!apiKey) {
        setApiKeyDialogOpen(true);
        return;
      }
      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      const selectedText = editor.state.doc.textBetween(from, to, "\n");
      if (!selectedText.trim()) return;

      setAiBusy(action);
      try {
        const result = await runWritingAction({ apiKey, model }, action, selectedText);
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, markdownToHtml(result))
          .run();
        toast.success(`${WRITING_ACTIONS[action].label} — done`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "AI request failed.");
      } finally {
        setAiBusy(null);
      }
    },
    [editor, apiKey, model, setApiKeyDialogOpen]
  );

  if (!editor) {
    return (
      <div className="space-y-3 pt-6">
        <div className="h-8 w-2/3 animate-pulse-soft rounded-lg bg-muted skeleton-shimmer" />
        <div className="h-4 w-full animate-pulse-soft rounded-md bg-muted skeleton-shimmer" />
        <div className="h-4 w-5/6 animate-pulse-soft rounded-md bg-muted skeleton-shimmer" />
      </div>
    );
  }

  const words = editor.storage.characterCount.words();

  return (
    <div>
      <Toolbar editor={editor} saving={saving} />

      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, maxWidth: 480 }}
        shouldShow={({ editor, state }) =>
          !state.selection.empty && !editor.isActive("codeBlock")
        }
      >
        <div className="flex items-center gap-0.5 rounded-xl border bg-popover p-1 shadow-raised">
          {aiBusy ? (
            <span className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {WRITING_ACTIONS[aiBusy].label}…
            </span>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ask AI
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {(Object.keys(WRITING_ACTIONS) as WritingAction[]).map((action) => (
                    <DropdownMenuItem key={action} onClick={() => void runAI(action)}>
                      {WRITING_ACTIONS[action].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="h-5 w-px bg-border" />

              <button
                type="button"
                aria-label="Bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground",
                  editor.isActive("bold") && "bg-accent text-accent-foreground"
                )}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground",
                  editor.isActive("italic") && "bg-accent text-accent-foreground"
                )}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Highlight"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground",
                  editor.isActive("highlight") && "bg-accent text-accent-foreground"
                )}
              >
                <Highlighter className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />

      <div className="pointer-events-none sticky bottom-3 flex justify-end pr-2">
        <span className="rounded-full border bg-card/80 px-3 py-1 text-2xs text-muted-foreground shadow-soft backdrop-blur">
          {words} {words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}
