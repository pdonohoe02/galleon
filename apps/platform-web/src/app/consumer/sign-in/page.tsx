import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; email?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/");
  const { error, email } = await searchParams;
  return <AuthForm mode="sign-in" action={signIn} email={email} error={error} />;
}
