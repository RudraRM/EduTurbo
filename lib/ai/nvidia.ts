import {
  AIError,
  type AIProvider,
  type ChatOptions,
  MISSING_KEY_MESSAGE,
} from "./provider";
import { WHISPER_MODEL } from "@/stores/settings-store";

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_AUDIO_URL = "https://integrate.api.nvidia.com/v1/audio/transcriptions";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    const message = data?.error?.message ?? data?.error ?? data?.message;
    if (typeof message === "string" && message) return message;
  } catch {
    // fall through
  }
  if (response.status === 401) return "Invalid NVIDIA NIM API key. Check it in Settings.";
  if (response.status === 429) return "NVIDIA NIM rate limit reached — try again in a moment.";
  return `Request failed (${response.status}).`;
}

async function consumeSSE(
  body: ReadableStream<Uint8Array>,
  onToken: (token: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const token: string | undefined = json.choices?.[0]?.delta?.content;
          if (token) {
            full += token;
            onToken(token);
          }
        } catch {
          // Ignore incomplete SSE frames.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return full;
}

class NvidiaProvider implements AIProvider {
  readonly name = "nvidia-nim";

  constructor(private readonly apiKey: string) {}

  private ensureKey() {
    if (!this.apiKey) throw new AIError(MISSING_KEY_MESSAGE, 401);
  }

  private async request(options: ChatOptions, stream: boolean): Promise<Response> {
    this.ensureKey();
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nvidia-key": this.apiKey,
      },
      signal: options.signal,
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 4096,
        stream,
        ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      throw new AIError(await readErrorMessage(response), response.status);
    }
    return response;
  }

  async streamChat(
    options: ChatOptions & { onToken: (token: string) => void }
  ): Promise<string> {
    const response = await this.request(options, true);
    if (!response.body) throw new AIError("Empty response stream.");
    return consumeSSE(response.body, options.onToken);
  }

  async chat(options: ChatOptions): Promise<string> {
    const response = await this.request(options, false);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new AIError("Malformed model response.");
    return content;
  }

  async transcribe(file: File, signal?: AbortSignal): Promise<string> {
    this.ensureKey();
    const form = new FormData();
    form.append("file", file);
    form.append("model", WHISPER_MODEL);
    form.append("response_format", "text");

    const response = await fetch("/api/ai/transcribe", {
      method: "POST",
      headers: { "x-nvidia-key": this.apiKey },
      body: form,
      signal,
    });

    if (!response.ok) {
      throw new AIError(await readErrorMessage(response), response.status);
    }
    return response.text();
  }
}

export function createProvider(apiKey: string): AIProvider {
  return new NvidiaProvider(apiKey);
}
