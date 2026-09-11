import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-sm space-y-8">
      <header className="animate-in-up space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
          Koya Talent
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Sign in
        </h1>
      </header>

      <SignInForm />

      <p className="text-center text-sm text-[var(--koya-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-[var(--koya-accent)] hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
