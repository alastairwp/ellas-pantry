import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { FridgeScanner } from "./FridgeScanner";

export const metadata: Metadata = {
  title: "What's In My Fridge?",
  description:
    "Upload a photo of your fridge and get recipe suggestions based on the ingredients you have.",
};

export default async function WhatsInMyFridgePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900">
        What&apos;s In My Fridge?
      </h1>
      <p className="mt-2 text-stone-500">
        Snap a photo of your fridge or freezer and we&apos;ll find recipes you
        can make with what you have.
      </p>

      <div className="mt-8">
        <FridgeScanner />
      </div>
    </div>
  );
}
