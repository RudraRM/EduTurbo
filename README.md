# ✨ Lumen — an AI learning workspace

Turn anything into knowledge. Upload PDFs, Word docs, slides, text, images,
audio, video — or paste a YouTube link — and Lumen generates beautiful,
fully-editable study notes, a document-aware AI tutor, flashcards, and four
kinds of quizzes.

Built with Next.js, Supabase, and Groq. Every user brings their own Groq API
key, stored **only in their browser** — never on a server.

## Features

- **8 source formats** — PDF, DOCX, PPTX, TXT/MD, images, audio, video, YouTube URLs
- **AI notes** — structured Markdown with key concepts, tables, LaTeX equations, ASCII diagrams, emoji callout boxes, definitions and a study guide; streamed live as they're written
- **Fully editable** — a TipTap rich-text editor with tables, checklists, highlights and code blocks
- **AI writing assistant** — select any text → improve, fix grammar, simplify, expand, condense, add examples, add an analogy
- **Document chat** — a tutor grounded in your notes *and* the original source
- **Flashcards** — generated decks with 3-D flip animations, shuffle and "got it" tracking
- **Quizzes** — multiple choice, true/false, fill-in-the-blank, and AI-graded short answers, with explanations and a score ring
- **Organization** — folders, tags, favorites, collections, recents, and ⌘K search
- **Sharing & export** — public share links, Markdown/HTML export, copy as Markdown
- **Polish** — light/dark mode, drag-and-drop uploads with step-by-step progress, loading skeletons, empty states, Framer Motion throughout, responsive down to mobile

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
shadcn/ui-style components (Radix primitives) · Framer Motion · Zustand ·
TanStack Query · Supabase (Auth + Postgres + Storage) · TipTap ·
React Markdown + KaTeX · Zod · React Hook Form · Groq (chat, vision, Whisper)

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql)
   (tables, row-level security, and the private storage bucket).
3. Copy `.env.example` to `.env.local` and fill in your project URL and anon key
   from **Project Settings → API**:

```bash
cp .env.example .env.local
```

Optional: enable the Google provider under **Authentication → Providers** to
activate "Continue with Google".

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000, create an account, and add your Groq key when
prompted (get one free at [console.groq.com/keys](https://console.groq.com/keys)).

## How the AI layer works

- **Groq only, by design.** The provider abstraction (`src/lib/ai/provider.ts`)
  ships with a single implementation: `GroqProvider`.
- **Keys are local to every user.** The key is kept in `localStorage`
  (Zustand persist) and attached per-request as a header. The `/api/ai/*`
  routes are stateless pass-through relays that exist only to avoid browser
  CORS constraints — nothing is logged or stored server-side.
- **Extraction is client-side.** PDFs (pdf.js), Word (mammoth), PowerPoint
  (JSZip + XML), and text files are parsed in the browser. Images go through
  Groq's vision model; audio/video through Groq Whisper; YouTube transcripts
  are fetched by a small server route (no key required).

## Project structure

```
src/
├── app/              # routes: landing, auth, dashboard, library, doc, settings, share, api
├── components/
│   ├── ui/           # shadcn-style primitives (button, dialog, tabs, …)
│   ├── shell/        # sidebar, topbar, ⌘K palette, API-key onboarding
│   ├── editor/       # TipTap note editor + AI bubble menu
│   ├── chat/         # document chat panel
│   ├── study/        # flashcards & quiz player
│   └── …
├── hooks/            # TanStack Query hooks over Supabase
├── lib/
│   ├── ai/           # provider abstraction, prompts, generation + Zod schemas
│   ├── extract/      # per-format text extraction
│   └── supabase/     # browser/server clients
├── stores/           # Zustand (settings, UI state)
└── middleware.ts     # session refresh + protected routes
```

## Notes

- Audio/video transcription is capped at 25 MB (Groq's upload limit).
- Scanned/image-only PDFs have no extractable text — upload pages as images instead.
- Sharing a note makes it readable by anyone with the link (`is_public` flag,
  enforced by RLS).
