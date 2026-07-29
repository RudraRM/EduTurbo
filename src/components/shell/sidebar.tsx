"use client";

import {
  FolderPlus,
  Home,
  Library,
  LogOut,
  Plus,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCreateFolder, useDeleteFolder, useFolders } from "@/hooks/use-documents";
import { useSignOut, useUser } from "@/hooks/use-user";
import { FOLDER_COLORS } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";
import { useUI } from "@/stores/ui-store";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: Library },
  { href: "/library?filter=favorites", label: "Favorites", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

const FOLDER_DOT: Record<string, string> = {
  violet: "bg-violet-400",
  sky: "bg-sky-400",
  mint: "bg-emerald-400",
  peach: "bg-orange-300",
  rose: "bg-rose-400",
  amber: "bg-amber-400",
};

function NewFolderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(FOLDER_COLORS[0].value);
  const createFolder = useCreateFolder();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createFolder.mutate(
      { name: trimmed, color },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>Group related documents together.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="e.g. Biology 101"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
        />
        <div className="flex items-center gap-2">
          {FOLDER_COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.name}
              onClick={() => setColor(option.value)}
              className={cn(
                "h-7 w-7 rounded-full transition-all",
                FOLDER_DOT[option.value],
                color === option.value
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-popover"
                  : "opacity-60 hover:opacity-100"
              )}
            />
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={!name.trim() || createFolder.isPending}
            className="w-full"
          >
            Create folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const signOut = useSignOut();
  const { data: folders } = useFolders();
  const deleteFolder = useDeleteFolder();
  const setUploadOpen = useUI((s) => s.setUploadOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-sidebar",
        className
      )}
    >
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
          <Logo />
        </Link>
      </div>

      <div className="px-3.5 pb-2">
        <Button
          className="w-full justify-start"
          onClick={() => {
            setSidebarOpen(false);
            setUploadOpen(true);
          }}
        >
          <Plus />
          New document
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-2">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const [itemPath, itemQuery] = item.href.split("?");
            const active =
              pathname === itemPath &&
              (itemQuery
                ? typeof window !== "undefined" &&
                  window.location.search.includes(itemQuery)
                : true);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    active && "bg-secondary text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-7">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Folders
            </span>
            <button
              type="button"
              aria-label="New folder"
              onClick={() => setFolderDialogOpen(true)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2 space-y-0.5">
            {(folders ?? []).map((folder) => (
              <li key={folder.id} className="group relative">
                <Link
                  href={`/library?folder=${folder.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 flex-none rounded-full",
                      FOLDER_DOT[folder.color] ?? "bg-zinc-400"
                    )}
                  />
                  <span className="truncate">{folder.name}</span>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete folder ${folder.name}`}
                  onClick={() => deleteFolder.mutate(folder.id)}
                  className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-destructive group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {folders && folders.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted-foreground/70">
                No folders yet
              </li>
            )}
          </ul>
        </div>
      </nav>

      <div className="border-t p-3.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary"
            >
              <Avatar>
                <AvatarFallback>{getInitials(displayName, user?.email)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {displayName || "Account"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NewFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} />
    </aside>
  );
}
