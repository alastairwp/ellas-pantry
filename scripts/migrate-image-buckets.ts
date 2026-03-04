import { PrismaClient } from "@prisma/client";
import { rename, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();
const IMAGES_BASE = path.join(process.cwd(), "public", "images", "recipes");

async function main() {
  const recipes = await prisma.recipe.findMany({
    where: { heroImage: { startsWith: "/images/recipes/" } },
    select: { id: true, slug: true, heroImage: true },
  });

  // Filter to only flat paths (e.g. /images/recipes/slug.webp, not /images/recipes/xx/slug.webp)
  const flatRecipes = recipes.filter((r) => {
    const parts = r.heroImage.replace("/images/recipes/", "").split("/");
    return parts.length === 1;
  });

  console.log(`Found ${flatRecipes.length} images to migrate into buckets`);

  let moved = 0;
  let failed = 0;

  for (const recipe of flatRecipes) {
    const filename = path.basename(recipe.heroImage);
    const bucket = recipe.slug.slice(0, 2);
    const oldPath = path.join(IMAGES_BASE, filename);
    const bucketDir = path.join(IMAGES_BASE, bucket);
    const newPath = path.join(bucketDir, filename);

    if (!existsSync(oldPath)) {
      failed++;
      continue;
    }

    try {
      await mkdir(bucketDir, { recursive: true });
      await rename(oldPath, newPath);

      const newLocalPath = `/images/recipes/${bucket}/${filename}`;
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { heroImage: newLocalPath },
      });

      moved++;
    } catch (error) {
      console.error(`Failed to migrate ${recipe.slug}:`, error);
      failed++;
    }

    if ((moved + failed) % 100 === 0) {
      console.log(`Progress: ${moved + failed}/${flatRecipes.length} (${moved} moved, ${failed} failed)`);
    }
  }

  console.log(`\nDone! Moved: ${moved}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
