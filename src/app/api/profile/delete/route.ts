import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { password, confirmation } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, image: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify identity
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
      }
    } else {
      // OAuth-only users must type DELETE to confirm
      if (confirmation !== "DELETE") {
        return NextResponse.json(
          { error: "Please type DELETE to confirm" },
          { status: 400 }
        );
      }
    }

    // Delete avatar file if exists
    if (user.image?.startsWith("/images/avatars/")) {
      const filepath = path.join(process.cwd(), "public", user.image);
      try {
        await unlink(filepath);
      } catch {
        // File may not exist
      }
    }

    // Delete user — all relations cascade automatically
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
