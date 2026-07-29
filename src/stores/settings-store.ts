"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const GROQ_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    hint: "Best quality · recommended",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    hint: "Strong reasoning",
  },
  {
    id: "moonshotai/kimi-k2-instruct",
    label: "Kimi K2",
    hint: "Great for long documents",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B",
    hint: "Fastest · lighter answers",
  },
] as const;

export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const WHISPER_MODEL = "whisper-large-v3-turbo";

interface SettingsState {
  /** The user's Groq API key. Stored in localStorage only — never on a server. */
  apiKey: string;
  model: string;
  hasOnboarded: boolean;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setHasOnboarded: (value: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      model: GROQ_MODELS[0].id,
      hasOnboarded: false,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
    }),
    { name: "lumen-settings" }
  )
);
