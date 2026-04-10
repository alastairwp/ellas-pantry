import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveGeneratedRecipe } from "@/lib/save-recipe";
import { processRecipeImage } from "@/lib/process-image";
import type { GeneratedRecipe } from "@/lib/generate-recipe";

const IMAGES_BASE = path.join(process.cwd(), "public", "images", "recipes");

/**
 * POST /api/user-recipes
 * Save a user-owned recipe (private by default).
 * Body: { recipe: GeneratedRecipe, visibility?: "private" | "shared", image?: string }
 *
 * If `image` is a base64 data URL and the caller is NOT an admin, the photo is
 * stored as the hero image and image generation is marked complete. Admins skip
 * this so the SDXL Turbo pipeline produces a generated image instead.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const recipe: GeneratedRecipe = body.recipe;
    const rawVisibility = body.visibility;
    const image: string | undefined = body.image;

    if (!recipe || !recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      return NextResponse.json(
        { error: "Invalid recipe payload" },
        { status: 400 }
      );
    }

    // Enforce: users cannot create public recipes.
    const visibility: "private" | "shared" =
      rawVisibility === "shared" ? "shared" : "private";

    const isAdmin = session.user.role === "admin";

    // Per-user recipe limit (admins exempt). Configurable via the
    // `user-recipe-limit` setting; defaults to 50.
    if (!isAdmin) {
      const limitSetting = await prisma.setting.findUnique({
        where: { key: "user-recipe-limit" },
      });
      const limit = parseInt(limitSetting?.value ?? "50", 10);
      const validLimit = Number.isFinite(limit) && limit > 0 ? limit : 50;
      const currentCount = await prisma.recipe.count({
        where: { createdById: session.user.id, published: false },
      });
      if (currentCount >= validLimit) {
        return NextResponse.json(
          {
            error: `You've reached your limit of ${validLimit} recipes. Delete some from My Recipes to add more.`,
          },
          { status: 403 }
        );
      }
    }

    const saved = await saveGeneratedRecipe(recipe, "", {
      source: "user-photo-dish",
      createdById: session.user.id,
      visibility,
      published: false,
      skipDuplicateCheck: true,
    });

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save recipe" },
        { status: 500 }
      );
    }

    // For non-admins, use the original photo as the hero image so they have
    // something to show immediately. Admins fall through to the SDXL Turbo
    // pipeline (imageStatus stays "pending").
    if (!isAdmin && typeof image === "string") {
      const match = image.match(/^data:image\/\w+;base64,(.+)$/);
      if (match) {
        try {
          const inputBuffer = Buffer.from(match[1], "base64");
          const { buffer: webpBuffer } = await processRecipeImage(inputBuffer);

          const bucket = saved.slug.slice(0, 2);
          const bucketDir = path.join(IMAGES_BASE, bucket);
          await mkdir(bucketDir, { recursive: true });

          const filename = `${saved.slug}-${Date.now()}.webp`;
          await writeFile(path.join(bucketDir, filename), webpBuffer);

          const localPath = `/images/recipes/${bucket}/${filename}`;
          await prisma.recipe.update({
            where: { id: saved.id },
            data: { heroImage: localPath, imageStatus: "generated" },
          });
        } catch (imgErr) {
          console.warn(
            `Failed to store user photo as hero for recipe ${saved.id}:`,
            imgErr
          );
          // Non-fatal: recipe is saved, image stays pending.
        }
      }
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Save user recipe error:", error);
    return NextResponse.json(
      { error: "Failed to save recipe" },
      { status: 500 }
    );
  }
}
