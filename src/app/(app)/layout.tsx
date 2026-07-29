"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { ApiKeyDialog } from "@/components/shell/api-key-dialog";
import { CommandPalette } from "@/components/shell/command-palette";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { UploadDialog } from "@/components/upload/upload-dialog";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

function OnboardingTrigger() {
  const { apiKey, hasOnboarded } = useSettings();
  const setApiKeyDialogOpen = useUI((s) => s.setApiKeyDialogOpen);

  useEffect(() => {
    if (!apiKey && !hasOnboarded) {
      const timer = setTimeout(() => setApiKeyDialogOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [apiKey, hasOnboarded, setApiKeyDialogOpen]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUI();

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette />
      <UploadDialog />
      <ApiKeyDialog />
      <OnboardingTrigger />
    </div>
  );
}
