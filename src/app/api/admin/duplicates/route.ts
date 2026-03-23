import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Find title+source combinations that appear more than once
  const duplicateGroups = await prisma.$queryRaw<
    { title: string; source: string; count: number }[]
  >`
    SELECT title, source, CAST(COUNT(*) AS integer) as count
    FROM "Recipe"
    GROUP BY title, source
    HAVING COUNT(*) > 1
    ORDER BY count DESC, title ASC
  `;

  // Fetch full recipe data for each duplicate group
  const groups = await Promise.all(
    duplicateGroups.map(async (group) => {
      const recipes = await prisma.recipe.findMany({
        where: {
          title: group.title,
          source: group.source,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          source: true,
          heroImage: true,
          description: true,
          prepTime: true,
          cookTime: true,
          servings: true,
          createdAt: true,
          ingredients: {
            include: { ingredient: { select: { name: true } } },
          },
          steps: { select: { stepNumber: true, instruction: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return {
        title: group.title,
        source: group.source,
        count: Number(group.count),
        recipes,
      };
    })
  );

  return NextResponse.json({
    totalGroups: groups.length,
    totalDuplicates: groups.reduce((sum, g) => sum + g.count - 1, 0),
    groups,
  });
}
