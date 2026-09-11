import { getSettings } from "@/lib/settings/actions";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="animate-in-up space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
          Settings
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight sm:text-4xl">
          Sender identity
        </h1>
        <p className="text-[var(--koya-muted)]">
          Controls what shows up in proposal documents and outgoing client
          emails — your company name, logo, designation, and the
          &quot;From&quot; address and greeting.
        </p>
      </header>

      <SettingsForm initial={settings} />
    </div>
  );
}
