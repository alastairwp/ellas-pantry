import { RegisterForm } from "./RegisterForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Create Account" };

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-neutral-900 text-center">
        Create Account
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        Sign up to save your favourite recipes and more.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-orange-600 hover:text-orange-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
