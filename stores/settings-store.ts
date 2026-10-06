"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const NVIDIA_MODELS = [
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    label: "Nemotron 3.5 Lightning 30B",
    hint: "Fast, capable, and recommended",
  },
  {
    id: "meta/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    hint: "Strong general-purpose reasoning",
  },
  {
    id: "moonshotai/kimi-k3",
    label: "Kimi K3",
    hint: "Long-context reasoning",
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b",
    label: "Nemotron 3 Nano",
    hint: "Fastest · lighter answers",
  },
] as const;

export const VISION_MODEL = "meta/muse-glimmer-30b";
export const WHISPER_MODEL = "nvidia/parakeet-ctc-1.1b-asr";

interface SettingsState {
  /** The user's NVIDIA NIM API key. Stored in localStorage only — never on a server. */
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
      model: NVIDIA_MODELS[0].id,
      hasOnboarded: false,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
    }),
    { name: "lumen-settings" }
  )
);
