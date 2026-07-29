"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUp, Eraser, Loader2, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MarkdownView } from "@/components/markdown-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatMessages, useClearChat, useSaveChatMessage } from "@/hooks/use-chat";
import { createProvider } from "@/lib/ai/groq";
import { chatSystemPrompt, clampContext } from "@/lib/ai/prompts";
import type { AIMessage } from "@/lib/ai/provider";
import { htmlToMarkdown } from "@/lib/markdown";
import type { Doc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

const SUGGESTIONS = [
  "Explain the hardest concept simply",
  "Give me a real-world example",
  "Summarize this in 5 bullets",
  "What's likely to be on a test?",
];

interface ChatPanelProps {
  doc: Doc;
  noteHtml: string;
}

export function ChatPanel({ doc, noteHtml }: ChatPanelProps) {
  const { apiKey, model } = useSettings();
  const setApiKeyDialogOpen = useUI((s) => s.setApiKeyDialogOpen);
  const queryClient = useQueryClient();
  const { data: messages } = useChatMessages(doc.id);
  const saveMessage = useSaveChatMessage(doc.id);
  const clearChat = useClearChat(doc.id);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = streaming !== null;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages?.length, streaming, pendingUser]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    if (!apiKey) {
      setApiKeyDialogOpen(true);
      return;
    }

    setInput("");
    setPendingUser(question);
    setStreaming("");

    const history: AIMessage[] = [
      ...(messages ?? []).slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: question },
    ];

    const system = chatSystemPrompt({
      title: doc.title,
      noteMarkdown: clampContext(noteHtml ? htmlToMarkdown(noteHtml) : "", 10_000),
      sourceText: clampContext(doc.extracted_text ?? "", 14_000),
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const provider = createProvider(apiKey);
      let assembled = "";
      await provider.streamChat({
        model,
        messages: [{ role: "system", content: system }, ...history],
        temperature: 0.5,
        maxTokens: 2048,
        signal: controller.signal,
        onToken: (token) => {
          assembled += token;
          setStreaming(assembled);
        },
      });

      await saveMessage.mutateAsync({ role: "user", content: question });
      await saveMessage.mutateAsync({ role: "assistant", content: assembled });
      queryClient.invalidateQueries({ queryKey: ["chat", doc.id] });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error(error instanceof Error ? error.message : "Chat request failed.");
      }
    } finally {
      setStreaming(null);
      setPendingUser(null);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  const hasMessages = (messages ?? []).length > 0 || pendingUser !== null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent"
            >
              <Sparkles className="h-7 w-7 text-accent-foreground" />
            </motion.div>
            <h3 className="mt-5 font-semibold">Ask anything about this document</h3>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              I know your notes and the original source. Questions, examples,
              analogies — go ahead.
            </p>
            <div className="mt-6 grid w-full max-w-sm gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-xl border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-raised"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5">
            {(messages ?? []).map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md gradient-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {message.content}
                  </div>
                ) : (
                  <MarkdownView
                    content={message.content}
                    className="max-w-full text-[14.5px] [&>*:first-child]:mt-0"
                  />
                )}
              </div>
            ))}

            {pendingUser && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md gradient-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {pendingUser}
                </div>
              </div>
            )}

            {streaming !== null && (
              <div className="flex justify-start">
                {streaming === "" ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Thinking…
                  </div>
                ) : (
                  <MarkdownView
                    content={streaming}
                    className="max-w-full text-[14.5px] [&>*:first-child]:mt-0"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-none border-t pt-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          {hasMessages && !busy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear conversation"
                  onClick={() => clearChat.mutate()}
                >
                  <Eraser />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear conversation</TooltipContent>
            </Tooltip>
          )}
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about this document…"
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none"
            aria-label="Chat message"
          />
          {busy ? (
            <Button size="icon" variant="secondary" onClick={stop} aria-label="Stop">
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => void send(input)}
              disabled={!input.trim()}
              aria-label="Send"
            >
              <ArrowUp />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-2xs text-muted-foreground/70">
          Answers are grounded in this document. Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
