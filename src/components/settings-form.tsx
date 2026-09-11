"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { updateSettings, uploadSenderLogo } from "@/lib/settings/actions";
import type { Settings } from "@/db/schema";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const toast = useToast();

  const [values, setValues] = useState({
    senderCompanyName: initial.senderCompanyName,
    senderDesignation: initial.senderDesignation,
    fromEmail: initial.fromEmail,
    emailSalutationTemplate: initial.emailSalutationTemplate,
  });
  const [savePending, startSaveTransition] = useTransition();

  const [logoUrl, setLogoUrl] = useState(initial.senderLogoUrl);
  const [logoPending, startLogoTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setField(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(formData: FormData) {
    startSaveTransition(async () => {
      const result = await updateSettings(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function onUploadLogo(formData: FormData) {
    startLogoTransition(async () => {
      const result = await uploadSenderLogo(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setLogoUrl(result.url);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="space-y-10 animate-in-up">
      <form action={onSave} className="space-y-6">
        <section className="space-y-4">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
              Company identity
            </h2>
            <p className="mt-1 text-sm text-[var(--koya-muted)]">
              Shown in the proposal document header/footer and in the
              signature of outgoing client emails.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senderCompanyName">Company name</Label>
              <Input
                id="senderCompanyName"
                name="senderCompanyName"
                value={values.senderCompanyName}
                onChange={(e) => setField("senderCompanyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderDesignation">Designation</Label>
              <Input
                id="senderDesignation"
                name="senderDesignation"
                value={values.senderDesignation}
                onChange={(e) => setField("senderDesignation", e.target.value)}
                placeholder="e.g. Founder, Account Executive"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
              Email
            </h2>
            <p className="mt-1 text-sm text-[var(--koya-muted)]">
              Controls the &quot;From&quot; address and greeting used when
              sending a proposal to a client.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From email</Label>
            <Input
              id="fromEmail"
              name="fromEmail"
              type="email"
              value={values.fromEmail}
              onChange={(e) => setField("fromEmail", e.target.value)}
              placeholder="proposals@yourcompany.com"
            />
            <p className="text-xs text-[var(--koya-muted)]">
              Leave blank to use the server&apos;s default (RESEND_FROM_EMAIL).
              Must be on a domain verified in your Resend account, or sends
              will fail.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailSalutationTemplate">Email salutation</Label>
            <Input
              id="emailSalutationTemplate"
              name="emailSalutationTemplate"
              value={values.emailSalutationTemplate}
              onChange={(e) =>
                setField("emailSalutationTemplate", e.target.value)
              }
            />
            <p className="text-xs text-[var(--koya-muted)]">
              Use <code>{"{{client_name}}"}</code> where the client&apos;s
              name should be inserted.
            </p>
          </div>
        </section>

        <Button type="submit" disabled={savePending} size="lg">
          {savePending ? "Saving…" : "Save settings"}
        </Button>
      </form>

      <div className="space-y-4 border-t border-[var(--koya-line)] pt-8">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Logo
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Shown next to your company name in the proposal document header.
            PNG, JPEG, WebP, or SVG, up to 2MB.
          </p>
        </div>

        {logoUrl && (
          <div className="flex h-16 items-center rounded-md border border-[var(--koya-line)] bg-white px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Current logo"
              className="max-h-10 max-w-[200px] object-contain"
            />
          </div>
        )}

        <form action={onUploadLogo} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="text-sm text-[var(--koya-ink-soft)] file:mr-3 file:rounded-md file:border file:border-[var(--koya-line)] file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--koya-ink)]"
          />
          <Button type="submit" variant="outline" disabled={logoPending}>
            {logoPending ? "Uploading…" : "Upload logo"}
          </Button>
        </form>
      </div>
    </div>
  );
}
