import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Verify identity on the server before loading private user data. */
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/auth/sign-in");
  return { supabase, userId: data.claims.sub, email: data.claims.email as string | undefined };
}
