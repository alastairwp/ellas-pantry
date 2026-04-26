import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { CollectionsList } from "./CollectionsList";

export const metadata: Metadata = {
  title: "My Collections",
  description: "Organise your favourite recipes into custom collections.",
};

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">My Collections</h1>
      <p className="mt-2 text-neutral-500">
        Organise your favourite recipes into custom collections.
      </p>

      <div className="mt-8">
        <CollectionsList />
      </div>
    </div>
  );
}
