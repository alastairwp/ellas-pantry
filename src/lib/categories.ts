import { prisma } from "./prisma";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
  });
}

export async function getAllCategorySlugs() {
  return prisma.category.findMany({
    select: { slug: true },
  });
}
