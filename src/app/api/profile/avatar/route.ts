import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const AVATARS_DIR = path.join(process.cwd(), "public", "images", "avatars");

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buffer)
      .resize(256, 256, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toBuffer();

    await mkdir(AVATARS_DIR, { recursive: true });

    const filename = `${session.user.id}.webp`;
    const filepath = path.join(AVATARS_DIR, filename);
    await writeFile(filepath, processed);

    const imagePath = `/images/avatars/${filename}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imagePath },
    });

    return NextResponse.json({ image: imagePath });
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filepath = path.join(AVATARS_DIR, `${session.user.id}.webp`);
    try {
      await unlink(filepath);
    } catch {
      // File may not exist, that's fine
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
