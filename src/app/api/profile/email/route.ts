import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { newEmail, password } = await request.json();

    if (!newEmail || !newEmail.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const trimmedEmail = newEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (trimmedEmail === user.email) {
      return NextResponse.json({ error: "New email is the same as current" }, { status: 400 });
    }

    // Verify password if user has one
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
      }
    }

    // Check if email is already taken
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: trimmedEmail },
    });

    return NextResponse.json({ success: true, email: trimmedEmail });
  } catch (error) {
    console.error("Email change failed:", error);
    return NextResponse.json({ error: "Failed to change email" }, { status: 500 });
  }
}
