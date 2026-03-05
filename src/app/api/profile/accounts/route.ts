import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [accounts, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    }),
  ]);

  return NextResponse.json({
    accounts,
    hasPassword: !!user?.passwordHash,
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    // Safety check: user must have at least one other auth method
    const [accounts, user] = await Promise.all([
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: { provider: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      }),
    ]);

    const otherAccounts = accounts.filter((a) => a.provider !== provider);
    const hasPassword = !!user?.passwordHash;

    if (otherAccounts.length === 0 && !hasPassword) {
      return NextResponse.json(
        { error: "Cannot unlink your only sign-in method. Set a password first." },
        { status: 400 }
      );
    }

    await prisma.account.deleteMany({
      where: { userId: session.user.id, provider },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlink account failed:", error);
    return NextResponse.json({ error: "Failed to unlink account" }, { status: 500 });
  }
}
