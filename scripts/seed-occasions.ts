import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const occasions = [
  { name: "Christmas", slug: "christmas", description: "Festive holiday recipes for the Christmas season", startMonth: 11, endMonth: 12 },
  { name: "Easter", slug: "easter", description: "Spring recipes for Easter celebrations", startMonth: 3, endMonth: 4 },
  { name: "Ramadan", slug: "ramadan", description: "Recipes for Ramadan and Iftar meals", startMonth: 2, endMonth: 4 },
  { name: "Halloween", slug: "halloween", description: "Spooky treats and autumn recipes", startMonth: 9, endMonth: 10 },
  { name: "Thanksgiving", slug: "thanksgiving", description: "Recipes for a Thanksgiving feast", startMonth: 10, endMonth: 11 },
  { name: "Valentine's Day", slug: "valentines-day", description: "Romantic recipes for Valentine's Day", startMonth: 1, endMonth: 2 },
  { name: "Summer BBQ", slug: "summer-bbq", description: "Grilling and outdoor dining recipes", startMonth: 5, endMonth: 8 },
  { name: "New Year", slug: "new-year", description: "Celebratory recipes for New Year's Eve and Day", startMonth: 12, endMonth: 1 },
];

async function main() {
  console.log("Seeding occasions...");

  for (const occasion of occasions) {
    await prisma.occasion.upsert({
      where: { slug: occasion.slug },
      update: occasion,
      create: occasion,
    });
    console.log(`  ✓ ${occasion.name} (${occasion.startMonth}-${occasion.endMonth})`);
  }

  console.log(`\nSeeded ${occasions.length} occasions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
