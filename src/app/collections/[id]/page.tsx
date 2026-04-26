import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface CollectionDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CollectionDetailProps): Promise<Metadata> {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id: parseInt(id, 10) },
    select: { name: true },
  });
  return { title: collection ? collection.name : "Collection Not Found" };
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      recipes: {
        include: {
          recipe: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              heroImage: true,
              prepTime: true,
              cookTime: true,
              difficulty: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!collection || collection.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
        <Link
          href="/collections"
          className="hover:text-orange-700 transition-colors"
        >
          My Collections
        </Link>
        <span>/</span>
        <span className="text-neutral-800">{collection.name}</span>
      </div>

      <h1 className="text-3xl font-bold text-neutral-900">{collection.name}</h1>
      <p className="mt-2 text-neutral-500">
        {collection.recipes.length} recipe
        {collection.recipes.length !== 1 ? "s" : ""}
      </p>

      {collection.recipes.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-neutral-500">
            This collection is empty.
          </p>
          <Link
            href="/recipes"
            className="mt-4 inline-block text-orange-600 hover:text-orange-700"
          >
            Browse recipes to add some
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.recipes.map(({ recipe }) => (
            <Link
              key={recipe.slug}
              href={`/recipes/${recipe.slug}`}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="relative h-[220px] w-full overflow-hidden">
                <Image
                  src={recipe.heroImage}
                  alt={recipe.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-neutral-800 group-hover:text-orange-700 transition-colors line-clamp-1">
                  {recipe.title}
                </h3>
                {recipe.description && (
                  <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span>
                    {formatDuration(recipe.prepTime + recipe.cookTime)}
                  </span>
                  {recipe.difficulty && (
                    <>
                      <span className="mx-1">·</span>
                      <span className="capitalize">{recipe.difficulty}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
