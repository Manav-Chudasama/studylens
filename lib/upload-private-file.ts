import { createClient } from "@/lib/supabase/client";

/** Upload directly to private Supabase Storage with chunk retries for files up to 20 MB. */
export async function uploadPrivateFile(file: File, path: string, mime: string) {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("Your session expired. Sign in again.");

  const apiUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const hostname = apiUrl.hostname.endsWith(".supabase.co")
    ? apiUrl.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co")
    : apiUrl.hostname;
  const endpoint = `${apiUrl.protocol}//${hostname}/storage/v1/upload/resumable`;
  const { Upload } = await import("tus-js-client");

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${session.access_token}` },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: "study-materials", objectName: path, contentType: mime },
      chunkSize: 6 * 1024 * 1024,
      onError: (cause) => reject(new Error(`Could not upload ${file.name}: ${cause.message}`)),
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}
