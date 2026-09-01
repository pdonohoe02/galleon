import { redirect } from "next/navigation";

import { getCurrentConsumer } from "@/lib/session";

import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; email?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  if (await getCurrentConsumer()) redirect("/consumer");
  const { error, email } = await searchParams;
  return <AuthForm mode="sign-up" action={signUp} email={email} error={error} />;
}
