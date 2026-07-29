import { z } from "zod";

import { createProvider } from "./groq";
import {
  clampContext,
  FLASHCARD_PROMPT,
  GRADE_PROMPT,
  noteGenerationMessages,
  quizPrompt,
  writingAssistantMessages,
  type WritingAction,
} from "./prompts";
import { AIError } from "./provider";
import type { QuizKind, QuizQuestion } from "@/lib/types";
import { VISION_MODEL } from "@/stores/settings-store";
import { IMAGE_EXTRACT_PROMPT } from "./prompts";

const NOTE_CONTEXT_CHARS = 26_000;
const STUDY_CONTEXT_CHARS = 20_000;

const flashcardsSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().min(1),
        back: z.string().min(1),
      })
    )
    .min(1),
});

const quizSchema = z.object({
  title: z.string().min(1),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string()).optional(),
        answer: z.union([z.string(), z.number()]).transform((v) => String(v)),
        explanation: z.string().default(""),
      })
    )
    .min(1),
});

const gradeSchema = z.object({
  verdict: z.enum(["correct", "partial", "incorrect"]),
  feedback: z.string().default(""),
});

/** Models occasionally wrap JSON in fences or prose — extract the object. */
function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new AIError("The model returned malformed JSON. Try again.");
  }
}

export interface GenerateConfig {
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

export async function generateNotes(
  config: GenerateConfig,
  source: { title: string; kind: string; text: string },
  onToken: (token: string) => void
): Promise<string> {
  const provider = createProvider(config.apiKey);
  return provider.streamChat({
    model: config.model,
    messages: noteGenerationMessages({
      ...source,
      text: clampContext(source.text, NOTE_CONTEXT_CHARS),
    }),
    temperature: 0.4,
    maxTokens: 6000,
    signal: config.signal,
    onToken,
  });
}

export async function generateFlashcards(
  config: GenerateConfig,
  material: string
): Promise<{ front: string; back: string }[]> {
  const provider = createProvider(config.apiKey);
  const raw = await provider.chat({
    model: config.model,
    messages: [
      { role: "system", content: FLASHCARD_PROMPT },
      {
        role: "user",
        content: `<material>\n${clampContext(material, STUDY_CONTEXT_CHARS)}\n</material>`,
      },
    ],
    temperature: 0.4,
    maxTokens: 4096,
    jsonMode: true,
    signal: config.signal,
  });
  return flashcardsSchema.parse(parseJsonLoose(raw)).cards;
}

export async function generateQuiz(
  config: GenerateConfig,
  kind: QuizKind,
  material: string
): Promise<{ title: string; questions: QuizQuestion[] }> {
  const count = kind === "short_answer" ? 5 : 8;
  const provider = createProvider(config.apiKey);
  const raw = await provider.chat({
    model: config.model,
    messages: [
      { role: "system", content: quizPrompt(kind, count) },
      {
        role: "user",
        content: `<material>\n${clampContext(material, STUDY_CONTEXT_CHARS)}\n</material>`,
      },
    ],
    temperature: 0.5,
    maxTokens: 4096,
    jsonMode: true,
    signal: config.signal,
  });
  const parsed = quizSchema.parse(parseJsonLoose(raw));
  return {
    title: parsed.title,
    questions: parsed.questions.map((q) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    })),
  };
}

export async function gradeShortAnswer(
  config: GenerateConfig,
  question: string,
  modelAnswer: string,
  studentAnswer: string
): Promise<{ verdict: "correct" | "partial" | "incorrect"; feedback: string }> {
  const provider = createProvider(config.apiKey);
  const raw = await provider.chat({
    model: config.model,
    messages: [
      { role: "system", content: GRADE_PROMPT },
      {
        role: "user",
        content: `Question: ${question}\n\nModel answer: ${modelAnswer}\n\nStudent answer: ${studentAnswer}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 512,
    jsonMode: true,
    signal: config.signal,
  });
  return gradeSchema.parse(parseJsonLoose(raw));
}

export async function runWritingAction(
  config: GenerateConfig,
  action: WritingAction,
  text: string
): Promise<string> {
  const provider = createProvider(config.apiKey);
  const result = await provider.chat({
    model: config.model,
    messages: writingAssistantMessages(action, text),
    temperature: 0.4,
    maxTokens: 4096,
    signal: config.signal,
  });
  return result.trim();
}

/** Extract text/description from an image via Groq's vision model. */
export async function extractImageContent(
  config: GenerateConfig,
  dataUrl: string
): Promise<string> {
  const provider = createProvider(config.apiKey);
  return provider.chat({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_EXTRACT_PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0.2,
    maxTokens: 4096,
    signal: config.signal,
  });
}

export async function transcribeMedia(
  config: GenerateConfig,
  file: File
): Promise<string> {
  const provider = createProvider(config.apiKey);
  return provider.transcribe(file, config.signal);
}
