import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarUploadForm } from "../settings/AvatarUploadForm";
import { ProfileSettingsForm } from "../settings/ProfileSettingsForm";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: user ? `${user.name || "User"}'s Profile` : "Profile Not Found" };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const session = await auth();
  const isOwner = session?.user?.id === id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  const [reviewCount, ratingCount, collectionCount, reviews, collections] =
    await Promise.all([
      prisma.review.count({ where: { userId: id } }),
      prisma.rating.count({ where: { userId: id } }),
      prisma.collection.count({ where: { userId: id } }),
      prisma.review.findMany({
        where: { userId: id },
        include: {
          recipe: { select: { id: true, slug: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.collection.findMany({
        where: { userId: id },
        include: { _count: { select: { recipes: true } } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-center gap-5">
        <Avatar name={user.name} image={user.image} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {user.name || "Anonymous"}
          </h1>
          <p className="text-sm text-neutral-500">Member since {memberSince}</p>
          {user.bio && (
            <p className="mt-2 text-neutral-600">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Edit Profile (owner only) */}
      {isOwner && (
        <section className="mt-10 space-y-8">
          <h2 className="text-xl font-semibold text-neutral-800">Edit Profile</h2>
          <AvatarUploadForm currentImage={user.image} userName={user.name || ""} />
          <ProfileSettingsForm initialName={user.name || ""} initialBio={user.bio || ""} />
        </section>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: "Reviews", value: reviewCount },
          { label: "Ratings", value: ratingCount },
          { label: "Collections", value: collectionCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-neutral-50 p-4 text-center"
          >
            <p className="text-2xl font-bold text-orange-700">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-neutral-800">
            Recent Reviews
          </h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-neutral-200 p-4"
              >
                <Link
                  href={`/recipes/${review.recipe.slug}`}
                  className="font-medium text-orange-700 hover:text-orange-800 transition-colors"
                >
                  {review.recipe.title}
                </Link>
                <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                  {review.text}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {new Date(review.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-neutral-800">Collections</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="rounded-lg border border-neutral-200 p-4"
              >
                <p className="font-medium text-neutral-800">{col.name}</p>
                <p className="text-sm text-neutral-500">
                  {col._count.recipes} recipe
                  {col._count.recipes !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
