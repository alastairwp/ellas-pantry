import { prisma } from "./prisma";

function isActiveOccasion(startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const current = currentMonth * 100 + currentDay; // e.g. March 20 = 320
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Wraps around year boundary (e.g. Dec 15 - Jan 5)
  return current >= start || current <= end;
}

export async function getOccasions() {
  return prisma.occasion.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getActiveOccasions() {
  const all = await getOccasions();
  return all.filter((o) => isActiveOccasion(o.startMonth, o.startDay, o.endMonth, o.endDay));
}

export async function getOccasionBySlug(slug: string) {
  return prisma.occasion.findUnique({
    where: { slug },
  });
}
