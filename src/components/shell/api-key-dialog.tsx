"use client";

import { ExternalLink, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createProvider } from "@/lib/ai/groq";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

export async function validateGroqKey(key: string, model: string): Promise<boolean> {
  try {
    const provider = createProvider(key);
    await provider.chat({
      model,
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 4,
    });
    return true;
  } catch {
    return false;
  }
}

export function ApiKeyDialog() {
  const { apiKeyDialogOpen, setApiKeyDialogOpen } = useUI();
  const { model, setApiKey, setHasOnboarded } = useSettings();
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);

  async function save() {
    const key = value.trim();
    if (!key) return;
    setChecking(true);
    const valid = await validateGroqKey(key, model);
    setChecking(false);

    if (!valid) {
      toast.error("That key didn't work. Double-check it and try again.");
      return;
    }

    setApiKey(key);
    setHasOnboarded(true);
    setApiKeyDialogOpen(false);
    setValue("");
    toast.success("You're all set — AI features unlocked ✨");
  }

  return (
    <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <KeyRound className="h-6 w-6 text-accent-foreground" />
          </div>
          <DialogTitle>Connect your Groq API key</DialogTitle>
          <DialogDescription>
            Lumen runs on Groq for near-instant AI. Create a free key, paste it
            below, and you&rsquo;re ready.
          </DialogDescription>
        </DialogHeader>

        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Get a free key at console.groq.com
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <Input
          type="password"
          placeholder="gsk_…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void save()}
          autoComplete="off"
        />

        <div className="flex items-start gap-2.5 rounded-xl bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
          Your key is stored only in this browser and sent directly with your
          requests. It never touches our database.
        </div>

        <Button onClick={() => void save()} disabled={!value.trim() || checking}>
          {checking && <Loader2 className="animate-spin" />}
          {checking ? "Verifying…" : "Save key"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
