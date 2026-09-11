import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-sm space-y-8">
      <header className="animate-in-up space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
          Koya Talent
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Create an account
        </h1>
      </header>

      <SignUpForm />

      <p className="text-center text-sm text-[var(--koya-muted)]">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-[var(--koya-accent)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
