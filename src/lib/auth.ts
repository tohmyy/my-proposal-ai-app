import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/db";
import { account, session, user, verification, type UserRole } from "@/db/schema";

function approverEmails(): string[] {
  return (process.env.APPROVER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: ["sales", "approver"],
        input: false,
        defaultValue: "sales",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const isApprover = approverEmails().includes(
            newUser.email.toLowerCase(),
          );
          return {
            data: {
              ...newUser,
              role: isApprover ? "approver" : "sales",
            },
          };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type CurrentUser = { id: string; email: string; role: UserRole };

/** Real, server-validated session lookup — not just a cookie-presence check. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result?.user) return null;
  const { id, email, role } = result.user as {
    id: string;
    email: string;
    role: UserRole;
  };
  return { id, email, role };
}
