import { processRecipeImage } from "./process-image";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";

const IMAGES_BASE = path.join(process.cwd(), "public", "images", "recipes");

function getBucket(slug: string): string {
  return slug.slice(0, 2);
}

export async function downloadRecipeImage(
  imageUrl: string,
  slug: string,
  recipeId?: number
): Promise<string | null> {
  // Skip placeholders and already-local paths
  if (!imageUrl.startsWith("http") || imageUrl.includes("placehold.co")) {
    return null;
  }

  try {
    const bucket = getBucket(slug);
    const bucketDir = path.join(IMAGES_BASE, bucket);
    await mkdir(bucketDir, { recursive: true });

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EllasPantry/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image for ${slug}: HTTP ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const { buffer: webpBuffer } = await processRecipeImage(buffer);

    const filename = `${slug}-${Date.now()}.webp`;
    const filepath = path.join(bucketDir, filename);
    await writeFile(filepath, webpBuffer);

    const localPath = `/images/recipes/${bucket}/${filename}`;

    // Update database if recipeId provided
    if (recipeId) {
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { heroImage: localPath },
      });
    }

    return localPath;
  } catch (error) {
    console.error(`Failed to download image for ${slug}:`, error);
    return null;
  }
}
