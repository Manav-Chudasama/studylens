import { createBrowserClient } from "@supabase/ssr";

/** Browser client sharing the cookie-backed session with server requests. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
