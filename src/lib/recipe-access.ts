import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/**
 * Build a Prisma where-clause that matches recipes the given user can see.
 * - Always includes published public recipes.
 * - If userId is provided, also includes recipes owned by the user and recipes
 *   shared with the user via RecipeShareUser.
 */
export function recipeVisibilityClause(
  userId: string | null | undefined
): Prisma.RecipeWhereInput {
  const clauses: Prisma.RecipeWhereInput[] = [
    { published: true, visibility: "public" },
  ];
  if (userId) {
    clauses.push({ createdById: userId });
    clauses.push({ sharedWith: { some: { sharedWithUserId: userId } } });
  }
  return { OR: clauses };
}

export type RecipeAccessResult =
  | { ok: true; visibility: "public" | "private" | "shared"; isOwner: boolean }
  | { ok: false; status: 401 | 403 | 404 };

/**
 * Check whether the current session user can access a recipe by id.
 *
 * Public recipes are always accessible.
 * Private/shared recipes require: owner, admin, or a row in RecipeShareUser.
 * (Share-link access is handled separately in the /r/share/[token] route.)
 */
export async function checkRecipeAccess(recipeId: number): Promise<RecipeAccessResult> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      published: true,
      visibility: true,
      createdById: true,
    },
  });
  if (!recipe) {
    return { ok: false, status: 404 };
  }

  const visibility = (recipe.visibility as "public" | "private" | "shared") || "public";

  if (visibility === "public" && recipe.published) {
    // Note: still need to be logged in for the AI helper endpoints; but the
    // public catalogue itself doesn't require auth.
    const session = await auth();
    return {
      ok: true,
      visibility,
      isOwner: !!session?.user && session.user.id === recipe.createdById,
    };
  }

  // Private or shared recipe — auth required
  const session = await auth();
  if (!session?.user) {
    return { ok: false, status: 401 };
  }

  const isOwner = recipe.createdById === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (isOwner || isAdmin) {
    return { ok: true, visibility, isOwner: true };
  }

  // Check named share
  const share = await prisma.recipeShareUser.findUnique({
    where: {
      recipeId_sharedWithUserId: {
        recipeId,
        sharedWithUserId: session.user.id,
      },
    },
  });
  if (share) {
    return { ok: true, visibility, isOwner: false };
  }

  return { ok: false, status: 404 }; // 404 not 403 — don't reveal existence
}
