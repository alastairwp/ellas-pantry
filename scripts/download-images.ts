import { PrismaClient } from "@prisma/client";
import { downloadRecipeImage } from "../src/lib/download-image";

const prisma = new PrismaClient();

const CONCURRENCY = 10;

async function main() {
  const recipes = await prisma.recipe.findMany({
    where: {
      heroImage: { startsWith: "http" },
    },
    select: { id: true, slug: true, heroImage: true },
  });

  console.log(`Found ${recipes.length} recipes with external images`);

  let downloaded = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < recipes.length; i += CONCURRENCY) {
    const batch = recipes.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (recipe) => {
        const localPath = await downloadRecipeImage(
          recipe.heroImage,
          recipe.slug,
          recipe.id
        );
        return { slug: recipe.slug, localPath };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.localPath) {
        downloaded++;
      } else {
        failed++;
        const slug =
          result.status === "fulfilled"
            ? result.value.slug
            : "unknown";
        failures.push(slug);
      }
    }

    console.log(
      `Progress: ${downloaded + failed}/${recipes.length} (${downloaded} downloaded, ${failed} failed)`
    );
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
  if (failures.length > 0) {
    console.log(`Failed recipes: ${failures.join(", ")}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
