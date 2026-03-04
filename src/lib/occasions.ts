import { prisma } from "./prisma";

function isActiveOccasion(startMonth: number, endMonth: number): boolean {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  if (startMonth <= endMonth) {
    return currentMonth >= startMonth && currentMonth <= endMonth;
  }
  // Wraps around year boundary (e.g. New Year: Dec-Jan)
  return currentMonth >= startMonth || currentMonth <= endMonth;
}

export async function getOccasions() {
  return prisma.occasion.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getActiveOccasions() {
  const all = await getOccasions();
  return all.filter((o) => isActiveOccasion(o.startMonth, o.endMonth));
}

export async function getOccasionBySlug(slug: string) {
  return prisma.occasion.findUnique({
    where: { slug },
  });
}
