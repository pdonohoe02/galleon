import { redirect } from "next/navigation";

import { getCurrentConsumer } from "@/lib/session";

import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; email?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  // Only a session that actually has a wallet is sent to the dashboard. A
  // wallet-less session must fall through and see the form, or it would
  // bounce between here and /consumer indefinitely.
  if (await getCurrentConsumer()) redirect("/consumer");
  const { error, email } = await searchParams;
  return <AuthForm mode="sign-in" action={signIn} email={email} error={error} />;
}
