"use client";

import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUI } from "@/stores/ui-store";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  );
}

export function Topbar() {
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 flex-none items-center gap-3 border-b px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu />
      </Button>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border bg-card px-3.5 text-sm text-muted-foreground shadow-soft transition-colors hover:bg-secondary/50"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search documents…</span>
        <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-mono text-2xs sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
