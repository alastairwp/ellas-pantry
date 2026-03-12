import { NextRequest, NextResponse } from "next/server";
import { processRecipeImage } from "@/lib/process-image";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const IMAGES_BASE = path.join(process.cwd(), "public", "images", "recipes");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const recipeId = formData.get("recipeId") as string | null;

    if (!file || !recipeId) {
      return NextResponse.json(
        { error: "File and recipeId are required" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(recipeId) },
      select: { slug: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { buffer: webpBuffer } = await processRecipeImage(buffer);

    const bucket = recipe.slug.slice(0, 2);
    const bucketDir = path.join(IMAGES_BASE, bucket);
    await mkdir(bucketDir, { recursive: true });

    const filename = `${recipe.slug}-${Date.now()}.webp`;
    const filepath = path.join(bucketDir, filename);
    await writeFile(filepath, webpBuffer);

    const localPath = `/images/recipes/${bucket}/${filename}`;

    await prisma.recipe.update({
      where: { id: parseInt(recipeId) },
      data: { heroImage: localPath, imageStatus: "generated" },
    });

    return NextResponse.json({ path: localPath, slug: recipe.slug });
  } catch (error) {
    console.error("Image upload failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Image upload failed: ${message}` },
      { status: 500 }
    );
  }
}
