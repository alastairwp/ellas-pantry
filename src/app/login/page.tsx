import { LoginForm } from "./LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Sign In" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-neutral-900 text-center">
        Sign In
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        Sign in to your account to access all features.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-orange-600 hover:text-orange-700"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
