import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { DishPhotoCreator } from "./DishPhotoCreator";

export const metadata: Metadata = {
  title: "Create a recipe from a photo",
  description:
    "Take a photo of a finished dish and let AI write a starting recipe you can edit and save to your private collection.",
};

export default async function NewRecipeFromPhotoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900">
        Create a recipe from a photo
      </h1>
      <p className="mt-2 text-stone-500">
        Take a photo of a finished dish. Our AI will identify it and draft a
        recipe based on what it can see. You can then edit it &mdash; add hidden
        ingredients, secret seasonings, family touches &mdash; before saving it
        to your own private collection.
      </p>

      <div className="mt-8">
        <DishPhotoCreator />
      </div>
    </div>
  );
}
