import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLERGY_TYPES } from "@/lib/allergies";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { name, bio, allergies, skillLevel } = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof name === "string") data.name = name.trim().slice(0, 100);
  if (typeof bio === "string") data.bio = bio.trim().slice(0, 200);
  if (Array.isArray(allergies)) {
    data.allergies = allergies.filter((a: string) =>
      (ALLERGY_TYPES as readonly string[]).includes(a)
    );
  }
  if (
    typeof skillLevel === "string" &&
    ["beginner", "intermediate", "advanced"].includes(skillLevel)
  ) {
    data.skillLevel = skillLevel;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, bio: true, allergies: true, skillLevel: true },
  });

  return NextResponse.json({ user });
}
