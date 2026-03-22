import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { FridgeScanner } from "./FridgeScanner";

export const metadata: Metadata = {
  title: "What's In My Fridge?",
  description:
    "Scan a photo or manually add ingredients from your fridge, cupboard, or larder and get recipe suggestions.",
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
        Scan a photo or add ingredients manually from your fridge, cupboard, or
        larder and we&apos;ll find recipes you can make.
      </p>

      <div className="mt-8">
        <FridgeScanner />
      </div>
    </div>
  );
}
