"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Tell us your name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.61l4 3.1C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

function SetupNotice() {
  return (
    <Card className="border-dashed p-5 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Supabase isn&rsquo;t configured yet</p>
      <p className="mt-1.5 leading-6">
        Copy <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> to{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>, add your
        project URL and anon key, then run{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/schema.sql</code>{" "}
        in the Supabase SQL editor.
      </p>
    </Card>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const isLogin = mode === "login";

  const form = useForm<LoginValues & Partial<SignupValues>>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const nextPath = searchParams.get("next") ?? "/dashboard";

  async function onSubmit(values: LoginValues & Partial<SignupValues>) {
    const supabase = getSupabaseBrowser();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Wrong email or password."
            : error.message
        );
        return;
      }
      router.push(nextPath);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setEmailSent(true);
      }
    }
  }

  async function signInWithGoogle() {
    setOauthLoading(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}` },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(false);
    }
  }

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--pastel-mint))]">
          <MailCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-300" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Check your inbox</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{form.getValues("email")}</span>.
          Click it to activate your workspace.
        </p>
        <Button variant="outline" className="mt-8" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <Link href="/" className="inline-block">
        <Logo />
      </Link>
      <h1 className="mt-10 text-3xl font-bold tracking-tight">
        {isLogin ? "Welcome back" : "Create your workspace"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isLogin
          ? "Pick up right where you left off."
          : "Beautiful notes, flashcards and quizzes — from anything you upload."}
      </p>

      {!isSupabaseConfigured ? (
        <div className="mt-8">
          <SetupNotice />
        </div>
      ) : (
        <>
          <Button
            variant="outline"
            className="mt-8 w-full"
            onClick={signInWithGoogle}
            disabled={oauthLoading}
          >
            {oauthLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Name</Label>
                <Input
                  id="fullName"
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Your password" : "At least 8 characters"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            New to Lumen?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </motion.div>
  );
}
