"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  FolderOpen,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ActivityChart, type ActivityPoint } from "@/components/dashboard/activity-chart";
import {
  DocumentCard,
  DocumentCardSkeleton,
} from "@/components/documents/document-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments, useFolders } from "@/hooks/use-documents";
import { useUser } from "@/hooks/use-user";
import { useUI } from "@/stores/ui-store";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2.5xl border bg-card p-5 shadow-soft"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5 text-foreground/70" />
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: documents, isLoading } = useDocuments();
  const { data: folders } = useFolders();
  const setUploadOpen = useUI((s) => s.setUploadOpen);

  const firstName =
    ((user?.user_metadata?.full_name as string | undefined) ?? "")
      .split(" ")[0] || "there";

  const activity = useMemo<ActivityPoint[]>(() => {
    const days: ActivityPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({ date, count: 0 });
    }
    for (const doc of documents ?? []) {
      const created = new Date(doc.created_at);
      created.setHours(0, 0, 0, 0);
      const index = days.findIndex((d) => d.date.getTime() === created.getTime());
      if (index !== -1) days[index].count += 1;
    }
    return days;
  }, [documents]);

  const thisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return (documents ?? []).filter((d) => new Date(d.created_at).getTime() > weekAgo)
      .length;
  }, [documents]);

  const recent = (documents ?? []).slice(0, 8);
  const favorites = (documents ?? []).filter((d) => d.favorite).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {greetingForNow()}, {firstName}
          </motion.h1>
        </div>
        <Button size="lg" onClick={() => setUploadOpen(true)} className="hidden sm:flex">
          <Plus />
          New document
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={FileText}
          label="Documents"
          value={documents?.length ?? 0}
          tint="bg-[hsl(var(--pastel-violet))]"
          index={0}
        />
        <StatTile
          icon={Star}
          label="Favorites"
          value={favorites}
          tint="bg-[hsl(var(--pastel-amber))]"
          index={1}
        />
        <StatTile
          icon={FolderOpen}
          label="Folders"
          value={folders?.length ?? 0}
          tint="bg-[hsl(var(--pastel-sky))]"
          index={2}
        />
        <StatTile
          icon={TrendingUp}
          label="Added this week"
          value={thisWeek}
          tint="bg-[hsl(var(--pastel-mint))]"
          index={3}
        />
      </div>

      {/* Chart + quick actions */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documents added — last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ActivityChart data={activity} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border bg-background p-3.5 text-left text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--pastel-violet))]">
                <Upload className="h-5 w-5 text-foreground/70" />
              </span>
              Upload a file
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border bg-background p-3.5 text-left text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--pastel-rose))]">
                <Youtube className="h-5 w-5 text-foreground/70" />
              </span>
              Import from YouTube
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </button>
            <Link
              href="/library"
              className="flex w-full items-center gap-3 rounded-xl border bg-background p-3.5 text-left text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--pastel-sky))]">
                <FolderOpen className="h-5 w-5 text-foreground/70" />
              </span>
              Browse library
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent</h2>
          {recent.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/library">
                View all
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <DocumentCardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Sparkles}
              title="Your workspace is ready"
              description="Upload a PDF, slides, audio, video — or paste a YouTube link — and watch it become beautiful notes."
              actionLabel="Add your first document"
              onAction={() => setUploadOpen(true)}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((doc, index) => (
              <DocumentCard key={doc.id} doc={doc} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <motion.button
        type="button"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setUploadOpen(true)}
        aria-label="New document"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
