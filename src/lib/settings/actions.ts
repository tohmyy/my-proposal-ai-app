"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  settings,
  SETTINGS_DEFAULTS,
  SETTINGS_SINGLETON_ID,
  type Settings,
} from "@/db/schema";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ensurePublicBucket } from "@/lib/supabase/storage";

const LOGO_BUCKET = "sender-assets";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Reads the singleton settings row, or the schema defaults if it hasn't been saved yet. */
export async function getSettings(): Promise<Settings> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.id, SETTINGS_SINGLETON_ID))
    .limit(1);

  if (row) return row;

  return {
    id: SETTINGS_SINGLETON_ID,
    ...SETTINGS_DEFAULTS,
    updatedAt: new Date(),
  };
}

export async function updateSettings(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const senderCompanyName =
    String(formData.get("senderCompanyName") ?? "").trim() ||
    SETTINGS_DEFAULTS.senderCompanyName;
  const senderDesignation = String(
    formData.get("senderDesignation") ?? "",
  ).trim();
  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const emailSalutationTemplate =
    String(formData.get("emailSalutationTemplate") ?? "").trim() ||
    SETTINGS_DEFAULTS.emailSalutationTemplate;

  const values = {
    senderCompanyName,
    senderDesignation,
    fromEmail,
    emailSalutationTemplate,
    updatedAt: new Date(),
  };

  await db
    .insert(settings)
    .values({ id: SETTINGS_SINGLETON_ID, ...values })
    .onConflictDoUpdate({ target: settings.id, set: values });

  revalidatePath("/settings");
  return { ok: true };
}

export async function uploadSenderLogo(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  const extension = LOGO_EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    return { ok: false, error: "Logo must be a PNG, JPEG, WebP, or SVG image." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: "Logo must be smaller than 2MB." };
  }

  const supabase = createSupabaseAdmin();
  await ensurePublicBucket(supabase, LOGO_BUCKET);

  const path = `sender/logo.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const values = { senderLogoUrl: data.publicUrl, updatedAt: new Date() };

  await db
    .insert(settings)
    .values({ id: SETTINGS_SINGLETON_ID, ...values })
    .onConflictDoUpdate({ target: settings.id, set: values });

  revalidatePath("/settings");
  return { ok: true, url: data.publicUrl };
}
