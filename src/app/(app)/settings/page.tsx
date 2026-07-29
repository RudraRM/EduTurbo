"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ExternalLink,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { validateGroqKey } from "@/components/shell/api-key-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSignOut, useUser } from "@/hooks/use-user";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { GROQ_MODELS, useSettings } from "@/stores/settings-store";

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
});

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Icon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export default function SettingsPage() {
  const { user } = useUser();
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { apiKey, model, setApiKey, setModel } = useSettings();

  const [keyDraft, setKeyDraft] = useState("");
  const [checkingKey, setCheckingKey] = useState(false);

  useEffect(() => setMounted(true), []);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: (user?.user_metadata?.full_name as string | undefined) ?? "",
    },
  });

  async function saveKey() {
    const key = keyDraft.trim();
    if (!key) return;
    setCheckingKey(true);
    const valid = await validateGroqKey(key, model);
    setCheckingKey(false);
    if (!valid) {
      toast.error("That key didn't work. Double-check it and try again.");
      return;
    }
    setApiKey(key);
    setKeyDraft("");
    toast.success("Groq key saved — stored only in this browser.");
  }

  async function saveProfile(values: z.infer<typeof profileSchema>) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: values.fullName },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated");
    }
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Your workspace, your rules.
      </p>

      <div className="mt-8 space-y-5">
        {/* AI */}
        <SectionCard
          icon={KeyRound}
          title="AI · Groq"
          description="Lumen is powered exclusively by Groq for near-instant responses."
        >
          <div className="space-y-5">
            <div>
              <Label htmlFor="groq-key">API key</Label>
              {apiKey ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border bg-secondary/50 px-3.5 font-mono text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {maskKey(apiKey)}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setApiKey("");
                      toast.success("Key removed from this browser.");
                    }}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Input
                    id="groq-key"
                    type="password"
                    placeholder="gsk_…"
                    value={keyDraft}
                    onChange={(event) => setKeyDraft(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && void saveKey()}
                    autoComplete="off"
                  />
                  <Button onClick={() => void saveKey()} disabled={!keyDraft.trim() || checkingKey}>
                    {checkingKey && <Loader2 className="animate-spin" />}
                    {checkingKey ? "Verifying" : "Save"}
                  </Button>
                </div>
              )}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Get a free key at console.groq.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div>
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROQ_MODELS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="font-medium">{option.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-secondary/60 p-3.5 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
              Your key lives only in this browser&rsquo;s local storage and is sent
              directly with your AI requests. It is never written to our database
              or visible to anyone else.
            </div>
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard
          icon={Sun}
          title="Appearance"
          description="Match your environment — or your mood."
        >
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft",
                  mounted && theme === option.value
                    ? "border-primary/50 bg-accent/50 shadow-glow"
                    : "text-muted-foreground"
                )}
              >
                <option.icon className="h-5 w-5" />
                {option.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard
          icon={User}
          title="Account"
          description="Who&rsquo;s doing all this learning?"
        >
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                className="mt-2"
                placeholder="Your name"
                {...profileForm.register("fullName")}
              />
              {profileForm.formState.errors.fullName && (
                <p className="mt-1 text-xs text-destructive">
                  {profileForm.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-2" value={user?.email ?? ""} disabled />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                {profileForm.formState.isSubmitting && <Loader2 className="animate-spin" />}
                Save profile
              </Button>
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void signOut()}>
                <LogOut />
                Sign out
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
