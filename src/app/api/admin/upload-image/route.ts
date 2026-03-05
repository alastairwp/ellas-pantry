import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { processRecipeImage } from "@/lib/process-image";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const IMAGES_BASE = path.join(process.cwd(), "public", "images", "recipes");

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slug = formData.get("slug") as string | null;

    if (!file || !slug) {
      return NextResponse.json(
        { error: "File and slug are required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { buffer: webpBuffer } = await processRecipeImage(buffer);

    const bucket = slug.slice(0, 2);
    const bucketDir = path.join(IMAGES_BASE, bucket);
    await mkdir(bucketDir, { recursive: true });

    const filename = `${slug}-${Date.now()}.webp`;
    const filepath = path.join(bucketDir, filename);
    await writeFile(filepath, webpBuffer);

    const localPath = `/images/recipes/${bucket}/${filename}`;

    return NextResponse.json({ path: localPath });
  } catch (error) {
    console.error("Image upload failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Image upload failed: ${message}` },
      { status: 500 }
    );
  }
}
