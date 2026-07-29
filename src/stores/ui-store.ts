"use client";

import { create } from "zustand";

interface UIState {
  uploadOpen: boolean;
  commandOpen: boolean;
  apiKeyDialogOpen: boolean;
  sidebarOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setApiKeyDialogOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  uploadOpen: false,
  commandOpen: false,
  apiKeyDialogOpen: false,
  sidebarOpen: false,
  setUploadOpen: (uploadOpen) => set({ uploadOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setApiKeyDialogOpen: (apiKeyDialogOpen) => set({ apiKeyDialogOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
