"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  BookOpenCheck,
  BrainCircuit,
  FileText,
  Layers,
  MessageCircleQuestion,
  MonitorPlay,
  NotebookPen,
  ScanText,
  Sparkles,
  Youtube,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { TypedText } from "@/components/typed-text";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const SOURCES = [
  { icon: FileText, label: "PDFs & Docs" },
  { icon: MonitorPlay, label: "Slides" },
  { icon: ScanText, label: "Images" },
  { icon: AudioLines, label: "Audio & video" },
  { icon: Youtube, label: "YouTube" },
];

const FEATURES = [
  {
    icon: NotebookPen,
    title: "Notes that teach",
    body: "Every upload becomes structured, editable notes — key concepts, tables, equations, callouts and a built-in study guide.",
    tint: "bg-[hsl(var(--pastel-violet))]",
  },
  {
    icon: MessageCircleQuestion,
    title: "A tutor on every page",
    body: "Chat with any document. Ask questions, simplify hard ideas, expand sections, or request examples and analogies.",
    tint: "bg-[hsl(var(--pastel-sky))]",
  },
  {
    icon: Layers,
    title: "Flashcards in one tap",
    body: "Generate a full deck from your material and flip through it with satisfying, fast animations.",
    tint: "bg-[hsl(var(--pastel-peach))]",
  },
  {
    icon: BrainCircuit,
    title: "Quizzes that adapt",
    body: "Multiple choice, true/false, fill-in-the-blank and AI-graded short answers — built from your exact content.",
    tint: "bg-[hsl(var(--pastel-mint))]",
  },
  {
    icon: BookOpenCheck,
    title: "A calm library",
    body: "Folders, tags, favorites, collections and instant search keep every subject exactly where you expect it.",
    tint: "bg-[hsl(var(--pastel-rose))]",
  },
  {
    icon: Zap,
    title: "Fast, private AI",
    body: "Powered by Groq for near-instant responses. Your API key lives only in your browser — never on our servers.",
    tint: "bg-[hsl(var(--pastel-amber))]",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[42rem]" />

      <header className="relative z-10">
        <nav className="container flex h-20 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="container pb-24 pt-16 text-center sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-soft backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Your AI learning workspace
            </div>
            <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Turn anything into <TypedText text="knowledge" className="gradient-text" delay={0.5} />
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              Drop in a lecture, paper, podcast or video. Lumen turns it into
              beautiful notes, flashcards and quizzes — with a tutor that knows
              your material inside out.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start learning free
                  <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </motion.div>

          {/* Source chips */}
          <motion.ul
            className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-2.5"
            initial="initial"
            animate="animate"
          >
            {SOURCES.map((source, index) => (
              <motion.li
                key={source.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.07, duration: 0.5 }}
                className="flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur"
              >
                <source.icon className="h-4 w-4 text-primary" />
                {source.label}
              </motion.li>
            ))}
          </motion.ul>

          {/* Product mock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="overflow-hidden rounded-3xl border bg-card/80 shadow-raised backdrop-blur">
              <div className="flex items-center gap-1.5 border-b px-5 py-3.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-muted-foreground">
                  Photosynthesis — Lecture 4
                </span>
              </div>
              <div className="grid gap-6 p-6 text-left sm:grid-cols-[1.5fr,1fr] sm:p-8">
                <div className="space-y-3">
                  <div className="text-2xl font-bold tracking-tight">
                    🌿 Photosynthesis
                  </div>
                  <div className="h-2.5 w-4/5 rounded-full bg-muted" />
                  <div className="h-2.5 w-3/5 rounded-full bg-muted" />
                  <div className="mt-4 rounded-2xl border border-primary/15 bg-accent/60 p-4 text-sm">
                    💡 <span className="font-semibold">Tip:</span> Light reactions
                    make ATP; the Calvin cycle spends it.
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted" />
                  <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border bg-background p-4 shadow-soft">
                    <div className="text-xs font-medium text-muted-foreground">
                      Flashcard 7 / 16
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      What do the light reactions produce?
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-background p-4 shadow-soft">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Ask Lumen
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      &ldquo;Explain the Calvin cycle like I&rsquo;m 12&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container pb-28">
          <motion.div {...fadeUp} className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to actually learn
            </h2>
            <p className="mt-4 text-muted-foreground">
              Not just summaries — a complete study system generated from your
              own material.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                className="group rounded-3xl border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-raised"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tint}`}
                >
                  <feature.icon className="h-6 w-6 text-foreground/80" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-28">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-4xl gradient-primary p-10 text-center text-primary-foreground sm:p-16"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Study smarter in the next five minutes
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-primary-foreground/85">
              Free to use with your own Groq API key. Your key stays in your
              browser — always.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="relative mt-8 bg-white text-zinc-900 hover:bg-white/90"
              asChild
            >
              <Link href="/signup">
                Create your workspace
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo className="opacity-80" />
          <p className="text-sm text-muted-foreground">
            Built for curious minds. Bring your own Groq key.
          </p>
        </div>
      </footer>
    </div>
  );
}
