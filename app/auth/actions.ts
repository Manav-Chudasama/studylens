"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
const emailSchema = z.email();
const passwordSchema = z.string().min(8);

export type AuthResult = { ok: true; destination: string } | { ok: false; message: string };

/** Sign in with a password and save the returned session in cookies. */
export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  return error
    ? { ok: false, message: "Could not sign in. Check your credentials or verify your email." }
    : { ok: true, destination: "/" };
}

/** Create an account and send the confirmation link to this site's callback. */
export async function signUp(input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email and a password of at least 8 characters." };
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { ok: false, message: "Could not create your account. Try again later." };
  return { ok: true, destination: data.session ? "/" : "/auth/verify" };
}

/** Request a reset email without revealing whether an address exists. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
  });
  return { ok: true, destination: "/auth/verify?reset=1" };
}

/** Replace the password after the recovery callback has established a session. */
export async function updatePassword(password: string): Promise<AuthResult> {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false, message: "Use at least 8 characters." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false, message: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  return error
    ? { ok: false, message: "Could not update your password. Request a new reset link." }
    : { ok: true, destination: "/" };
}

/** Clear the current cookie-backed session. */
export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return error
    ? { ok: false, message: "Could not sign out. Try again." }
    : { ok: true, destination: "/auth/sign-in" };
}
