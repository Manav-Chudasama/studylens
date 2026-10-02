import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/components/study/update-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/reset-password");
  return <UpdatePasswordForm />;
}
