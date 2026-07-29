const NOTE_STYLE = `You write beautiful, information-dense study notes in Markdown. Follow these rules exactly:

STRUCTURE
- Begin with a single "# " H1 title (short, descriptive, one fitting emoji at the start).
- Directly under the title, write a one-paragraph overview in plain language.
- Then a "## 🔑 Key Concepts" section: a bulleted list where each bullet starts with a **bolded term** followed by an em-dash and a crisp one-line definition.
- Then 3–7 thematic "## " sections that teach the material in a logical order. Use a fitting emoji at the start of every H2 heading.
- Where the material compares things, lists properties, or has structured data, use Markdown tables.
- Where the material includes math, chemistry, or formulas, write equations in LaTeX: inline as $...$ and display as $$...$$ blocks.
- Where a process or relationship benefits from a diagram, add a fenced code block labelled \`text\` containing a simple ASCII diagram (boxes and arrows), introduced by a short sentence.
- Use blockquotes as callout boxes, always starting with an emoji and a bold label, e.g. "> 💡 **Tip:** ...", "> ⚠️ **Common mistake:** ...", "> 📌 **Remember:** ...". Include at least two callouts.
- End with "## 🎯 Study Guide": 4–8 checkbox items ("- [ ] ...") phrased as review actions, followed by a "**Quick self-test:**" line with three short recall questions.

STYLE
- Explain simply, as a brilliant tutor would. Prefer short sentences.
- Bold key terms on first use. Use bullet lists over walls of text.
- Use sprinkled, purposeful emoji in headings, callouts and occasionally bullets — never more than one per line.
- Never invent facts that are not supported by the source material. If the source is thin, keep the notes short rather than padding.
- Output pure Markdown only — no preamble, no closing remarks, no code fence around the whole document.`;

export function noteGenerationMessages(source: {
  title: string;
  kind: string;
  text: string;
}) {
  return [
    { role: "system" as const, content: NOTE_STYLE },
    {
      role: "user" as const,
      content: `Create complete study notes for the following ${source.kind} titled "${source.title}".\n\n<source>\n${source.text}\n</source>`,
    },
  ];
}

export function chatSystemPrompt(context: {
  title: string;
  noteMarkdown: string;
  sourceText: string;
}) {
  return `You are Lumen's study assistant — a warm, sharp tutor attached to the document "${context.title}".

Your job: answer questions, explain and simplify difficult ideas, expand on sections, rewrite paragraphs on request, and invent concrete examples and analogies — always grounded in the document below.

Rules:
- Ground answers in the provided notes and source. If something isn't covered, say so briefly, then answer from general knowledge and mark it as outside the document.
- Format with Markdown: headings only when useful, bullet lists, **bold** key terms, tables for comparisons, $...$ / $$...$$ for math.
- Keep answers tight by default; go deep only when asked.
- When asked to rewrite or simplify text, output only the rewritten text.

<notes>
${context.noteMarkdown}
</notes>

<source>
${context.sourceText}
</source>`;
}

export const FLASHCARD_PROMPT = `Create flashcards from the study material. Return STRICT JSON: {"cards": [{"front": "...", "back": "..."}]}.
- 12 to 20 cards covering every key concept, definition, formula and fact.
- Fronts are questions or terms (concise). Backs are complete but short answers (1–3 sentences, may include $...$ LaTeX).
- No numbering, no markdown headings inside cards. JSON only.`;

export function quizPrompt(kind: string, count: number): string {
  const shared = `Create a quiz from the study material. Return STRICT JSON with this exact shape: {"title": "...", "questions": [{"question": "...", "options": [...], "answer": "...", "explanation": "..."}]}. Write exactly ${count} questions. Every question must include a one-sentence "explanation" of the correct answer. JSON only, no markdown.`;
  switch (kind) {
    case "mcq":
      return `${shared}\nQuestion type: multiple choice. Each question has an "options" array of exactly 4 plausible choices, and "answer" is the 0-based index of the correct option as a string (e.g. "2"). Distractors must be plausible.`;
    case "true_false":
      return `${shared}\nQuestion type: true/false. Each "question" is a statement. Omit "options". "answer" is exactly "true" or "false". Mix true and false statements roughly evenly.`;
    case "fill_blank":
      return `${shared}\nQuestion type: fill in the blank. Each "question" is a sentence with exactly one blank written as "_____". Omit "options". "answer" is the missing word or short phrase (max 4 words).`;
    case "short_answer":
      return `${shared}\nQuestion type: short answer. Each "question" invites a 1–3 sentence response. Omit "options". "answer" is a model answer (1–3 sentences).`;
    default:
      return shared;
  }
}

export const GRADE_PROMPT = `You grade a student's short answer. Return STRICT JSON: {"verdict": "correct" | "partial" | "incorrect", "feedback": "..."}.
- "correct": captures the essential idea, minor wording differences are fine.
- "partial": some key elements present, others missing or muddled.
- "incorrect": misses the point or states something wrong.
- "feedback" is 1–2 encouraging sentences noting what was right and what was missing. JSON only.`;

export type WritingAction =
  | "improve"
  | "grammar"
  | "simplify"
  | "expand"
  | "condense"
  | "examples"
  | "analogy";

export const WRITING_ACTIONS: Record<
  WritingAction,
  { label: string; instruction: string }
> = {
  improve: {
    label: "Improve writing",
    instruction:
      "Rewrite the text to be clearer, tighter and more engaging while preserving its meaning, format and approximate length.",
  },
  grammar: {
    label: "Fix grammar",
    instruction:
      "Correct grammar, spelling and punctuation only. Change nothing else — keep wording, tone and formatting intact.",
  },
  simplify: {
    label: "Simplify",
    instruction:
      "Rewrite the text in plain, simple language a smart 14-year-old would understand. Keep all essential information.",
  },
  expand: {
    label: "Expand",
    instruction:
      "Expand the text with more depth: add relevant detail, context or brief examples. Aim for roughly double the length. Keep the same format.",
  },
  condense: {
    label: "Condense",
    instruction:
      "Condense the text to roughly half its length, keeping every essential idea. Prefer bullet points if the original uses them.",
  },
  examples: {
    label: "Add examples",
    instruction:
      "Keep the text as-is, then append 1–3 concrete, vivid examples that illustrate it. Introduce them naturally (e.g. a short '**Examples:**' lead-in).",
  },
  analogy: {
    label: "Add analogy",
    instruction:
      "Keep the text as-is, then append one memorable real-world analogy that makes the idea intuitive, introduced with '**Analogy:**'.",
  },
};

export function writingAssistantMessages(action: WritingAction, text: string) {
  return [
    {
      role: "system" as const,
      content: `You are a precise writing assistant for study notes. ${WRITING_ACTIONS[action].instruction} Respond with ONLY the resulting Markdown text — no preamble, no quotes, no code fence.`,
    },
    { role: "user" as const, content: text },
  ];
}

export const IMAGE_EXTRACT_PROMPT = `Extract everything from this image for study purposes. Transcribe all visible text verbatim (including labels, formulas as LaTeX, table contents). Then describe any diagrams, charts or figures and what they convey. Be thorough and factual. Plain text output.`;

/** Trim long source text to keep prompts inside model context limits. */
export function clampContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const head = text.slice(0, Math.floor(maxChars * 0.75));
  const tail = text.slice(-Math.floor(maxChars * 0.2));
  return `${head}\n\n[... middle of source trimmed for length ...]\n\n${tail}`;
}
