import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { shareToken: token },
    select: { title: true, description: true, heroImage: true },
  });
  if (!recipe) return { title: "Recipe not found" };
  return {
    title: recipe.title,
    description: recipe.description,
    robots: { index: false, follow: false },
  };
}

export default async function SharedRecipePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) notFound();

  const recipe = await prisma.recipe.findUnique({
    where: { shareToken: token },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      steps: { orderBy: { stepNumber: "asc" } },
    },
  });

  if (!recipe || !recipe.shareToken) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 inline-block px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
        Shared privately via link
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
        {recipe.title}
      </h1>

      {recipe.heroImage && (
        <div className="mt-6 rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={recipe.heroImage}
            alt={recipe.title}
            width={1200}
            height={800}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
        <span>
          <strong>Prep:</strong> {recipe.prepTime} min
        </span>
        <span>
          <strong>Cook:</strong> {recipe.cookTime} min
        </span>
        <span>
          <strong>Serves:</strong> {recipe.servings}
        </span>
        <span>
          <strong>Difficulty:</strong> {recipe.difficulty}
        </span>
      </div>

      {recipe.description && (
        <p className="mt-6 text-lg text-stone-700 leading-relaxed">
          {recipe.description}
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-stone-800 mb-3">Ingredients</h2>
        <ul className="space-y-1.5 text-stone-700">
          {recipe.ingredients.map((ri) => (
            <li key={ri.id}>
              <span className="font-medium">
                {ri.quantity}
                {ri.unit ? ` ${ri.unit}` : ""}
              </span>{" "}
              {ri.ingredient.name}
              {ri.notes ? `, ${ri.notes}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-stone-800 mb-3">Method</h2>
        <ol className="space-y-4 text-stone-700 list-decimal pl-5">
          {recipe.steps.map((s) => (
            <li key={s.id}>
              <p>{s.instruction}</p>
              {s.tipText && (
                <p className="mt-1 text-sm text-amber-700 italic">Tip: {s.tipText}</p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
