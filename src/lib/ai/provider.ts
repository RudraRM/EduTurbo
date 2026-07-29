/**
 * Provider abstraction for chat-completion style AI backends.
 *
 * Lumen ships with a single provider — Groq — per product requirements, but
 * everything above this layer only talks to the `AIProvider` interface, so a
 * different backend can be dropped in without touching feature code.
 *
 * Requests are relayed through same-origin API routes (`/api/ai/*`) purely to
 * avoid browser CORS constraints. The user's API key travels in a request
 * header and is never logged or persisted server-side.
 */

export interface AIMessageContentText {
  type: "text";
  text: string;
}

export interface AIMessageContentImage {
  type: "image_url";
  image_url: { url: string };
}

export type AIMessageContent = string | (AIMessageContentText | AIMessageContentImage)[];

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: AIMessageContent;
}

export interface ChatOptions {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: string;
  /** Streaming completion. Calls onToken for each delta, resolves to full text. */
  streamChat(options: ChatOptions & { onToken: (token: string) => void }): Promise<string>;
  /** Non-streaming completion. */
  chat(options: ChatOptions): Promise<string>;
  /** Audio/video transcription. */
  transcribe(file: File, signal?: AbortSignal): Promise<string>;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AIError";
  }
}

export const MISSING_KEY_MESSAGE =
  "Add your Groq API key in Settings to unlock AI features.";
