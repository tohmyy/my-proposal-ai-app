import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** Creates a public Storage bucket if it doesn't already exist. */
export async function ensurePublicBucket(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  bucketName: string,
) {
  const { data: existing } = await supabase.storage.getBucket(bucketName);
  if (existing) return;

  const { error } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });
  // Ignore a race where another request created it first.
  if (error && !error.message?.toLowerCase().includes("already exists")) {
    throw error;
  }
}
