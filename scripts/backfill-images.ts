import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function searchPexels(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;

  const encoded = encodeURIComponent(query + " food");
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encoded}&per_page=1&orientation=portrait`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.photos?.[0]?.src?.large2x || null;
}

async function main() {
  const recipes = await prisma.recipe.findMany({
    where: { heroImage: { contains: "placehold.co" } },
    select: { id: true, title: true },
  });

  console.log(`Found ${recipes.length} recipes with placeholder images\n`);

  let updated = 0;
  for (const recipe of recipes) {
    let imageUrl = await searchPexels(recipe.title);

    if (!imageUrl) {
      // Try simpler query
      const simple = recipe.title.split(" ").slice(0, 3).join(" ");
      imageUrl = await searchPexels(simple);
    }

    if (imageUrl) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { heroImage: imageUrl },
      });
      updated++;
      console.log(`  ✓ ${recipe.title}`);
    } else {
      console.log(`  ✗ No image found: ${recipe.title}`);
    }
  }

  console.log(`\nDone: ${updated}/${recipes.length} updated`);
}

main().then(() => prisma.$disconnect());
