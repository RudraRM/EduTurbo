"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Loader2,
  PartyPopper,
  RefreshCw,
  Shuffle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { MarkdownView } from "@/components/markdown-view";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFlashcards, useSaveFlashcards } from "@/hooks/use-study";
import { generateFlashcards } from "@/lib/ai/generate";
import type { Doc } from "@/lib/types";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

interface FlashcardsViewProps {
  doc: Doc;
  material: string;
}

export function FlashcardsView({ doc, material }: FlashcardsViewProps) {
  const { apiKey, model } = useSettings();
  const setApiKeyDialogOpen = useUI((s) => s.setApiKeyDialogOpen);
  const { data: cards, isLoading } = useFlashcards(doc.id);
  const saveCards = useSaveFlashcards(doc.id);

  const [generating, setGenerating] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const deck = useMemo(() => cards ?? [], [cards]);

  useEffect(() => {
    setOrder(deck.map((_, i) => i));
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setFinished(false);
  }, [deck]);

  const generate = useCallback(async () => {
    if (!apiKey) {
      setApiKeyDialogOpen(true);
      return;
    }
    setGenerating(true);
    try {
      const generated = await generateFlashcards({ apiKey, model }, material);
      await saveCards.mutateAsync(generated);
      toast.success(`Created ${generated.length} flashcards`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't generate flashcards.");
    } finally {
      setGenerating(false);
    }
  }, [apiKey, model, material, saveCards, setApiKeyDialogOpen]);

  function shuffle() {
    setOrder((current) => {
      const next = [...current];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setFinished(false);
  }

  const advance = useCallback(
    (gotIt: boolean) => {
      const cardIndex = order[index];
      if (gotIt) {
        setKnown((current) => new Set(current).add(cardIndex));
      }
      setFlipped(false);
      if (index + 1 >= order.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
      }
    },
    [index, order]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (deck.length === 0 || finished) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
        return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped((f) => !f);
      } else if (event.key === "ArrowRight") {
        advance(true);
      } else if (event.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
        setFlipped(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deck.length, finished, advance, index]);

  if (isLoading) {
    return (
      <div className="mx-auto mt-8 h-72 max-w-xl animate-pulse-soft rounded-3xl bg-muted skeleton-shimmer" />
    );
  }

  if (deck.length === 0) {
    return (
      <div className="mx-auto max-w-xl pt-6">
        {generating ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed px-8 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h3 className="mt-6 text-lg font-semibold">Building your deck…</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Distilling every key concept into flashcards.
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Layers}
            title="No flashcards yet"
            description="Generate a deck from this document — every key concept, definition and formula becomes a card."
            actionLabel="Generate flashcards"
            onAction={() => void generate()}
          />
        )}
      </div>
    );
  }

  if (finished) {
    const score = known.size;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-xl pt-6 text-center"
      >
        <div className="rounded-3xl border bg-card p-10 shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[hsl(var(--pastel-mint))]">
            <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
          </div>
          <h3 className="mt-6 text-2xl font-bold tracking-tight">Deck complete!</h3>
          <p className="mt-2 text-muted-foreground">
            You knew{" "}
            <span className="font-semibold text-foreground">
              {score} of {deck.length}
            </span>{" "}
            cards. {score === deck.length ? "Flawless. 🎉" : "The rest will stick next round."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={shuffle}>
              <Shuffle />
              Study again
            </Button>
            <Button variant="outline" onClick={() => void generate()} disabled={generating}>
              {generating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Regenerate deck
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const cardIndex = order[index];
  const card = cardIndex !== undefined ? deck[cardIndex] : undefined;

  if (!card) {
    return (
      <div className="mx-auto mt-8 h-72 max-w-xl animate-pulse-soft rounded-3xl bg-muted skeleton-shimmer" />
    );
  }

  return (
    <div className="mx-auto max-w-xl pt-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          {index + 1} / {deck.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={shuffle}>
            <Shuffle />
            Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void generate()} disabled={generating}>
            {generating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Regenerate
          </Button>
        </div>
      </div>
      <Progress value={((index + 1) / deck.length) * 100} className="mt-3" />

      <div className="mt-6 [perspective:1200px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={`${order[index]}`}
            type="button"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={() => setFlipped((f) => !f)}
            className="relative block h-72 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
            aria-label={flipped ? "Show question" : "Show answer"}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-full [transform-style:preserve-3d]"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-raised [backface-visibility:hidden]">
                <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Question
                </span>
                <div className="mt-4 overflow-y-auto text-center text-lg font-semibold leading-relaxed">
                  {card.front}
                </div>
                <span className="mt-auto pt-4 text-xs text-muted-foreground/70">
                  Tap to reveal
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-primary/25 bg-accent/50 p-8 shadow-raised [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-2xs font-semibold uppercase tracking-widest text-accent-foreground/70">
                  Answer
                </span>
                <div className="mt-4 max-h-44 overflow-y-auto text-center">
                  <MarkdownView
                    content={card.back}
                    className="text-[15px] [&>*:first-child]:mt-0"
                  />
                </div>
              </div>
            </motion.div>
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous card"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
        >
          <ArrowLeft />
        </Button>
        <Button
          variant="outline"
          className="min-w-28"
          onClick={() => advance(false)}
        >
          Still learning
        </Button>
        <Button className="min-w-28" onClick={() => advance(true)}>
          Got it
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next card"
          onClick={() => advance(true)}
        >
          <ArrowRight />
        </Button>
      </div>
      <p className="mt-4 text-center text-2xs text-muted-foreground/70">
        Space to flip · ← previous · → got it
      </p>
    </div>
  );
}
