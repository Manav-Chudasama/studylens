"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailSchema = z.email("Enter a valid email address.");
const passwordSchema = z.string().min(8, "Use at least 8 characters.");

export type AuthMode = "sign-in" | "sign-up" | "reset-password";
export type AuthSubmission = {
  mode: AuthMode;
  email: string;
  password?: string;
};

type AuthFormProps = {
  mode: AuthMode;
  onSubmit?: (submission: AuthSubmission) => Promise<void>;
};

/** Reusable account form for the planned Supabase email/password flow. */
export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReset = mode === "reset-password";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const emailResult = emailSchema.safeParse(email.trim());
    if (!emailResult.success) return setNotice(emailResult.error.issues[0]?.message ?? "Check your email.");
    if (!isReset) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) return setNotice(passwordResult.error.issues[0]?.message ?? "Check your password.");
      if (mode === "sign-up" && password !== confirmation) return setNotice("Passwords do not match.");
    }
    if (!onSubmit) return setNotice("Account actions will be available when authentication is connected.");

    try {
      setIsSubmitting(true);
      await onSubmit({ mode, email: emailResult.data, password: isReset ? undefined : password });
    } catch {
      setNotice("The account request could not be completed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = mode === "sign-in" ? "Welcome back" : mode === "sign-up" ? "Create an account" : "Reset your password";
  const description = isReset
    ? "We’ll email you a password reset link."
    : "Keep your study materials and conversations in one private library.";

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <Link className="flex items-center justify-center gap-2 text-lg font-semibold" href="/">
          <BookOpenText className="size-5" /> StudyLens
        </Link>
        <Card className="gap-5 py-6">
          <CardHeader className="space-y-2 px-6">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="space-y-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input autoComplete="email" id="auth-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
              </div>
              {!isReset && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password">Password</Label>
                    {mode === "sign-in" && <Link className="text-xs underline underline-offset-4" href="/auth/reset-password">Forgot password?</Link>}
                  </div>
                  <Input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} id="auth-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
                </div>
              )}
              {mode === "sign-up" && (
                <div className="space-y-2">
                  <Label htmlFor="auth-confirm">Confirm password</Label>
                  <Input autoComplete="new-password" id="auth-confirm" onChange={(event) => setConfirmation(event.target.value)} type="password" value={confirmation} />
                </div>
              )}
              {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}
            </CardContent>
            <CardFooter className="mt-5 flex-col gap-3 border-0 bg-transparent px-6 py-0">
              <Button className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Please wait..." : isReset ? "Send reset link" : mode === "sign-up" ? "Create account" : "Sign in"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {mode === "sign-up" ? "Already have an account? " : "New to StudyLens? "}
                <Link className="font-medium text-foreground underline underline-offset-4" href={mode === "sign-up" ? "/auth/sign-in" : "/auth/sign-up"}>
                  {mode === "sign-up" ? "Sign in" : "Create account"}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
