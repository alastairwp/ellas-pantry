import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const occasions = await prisma.occasion.findMany({
    orderBy: { startMonth: "asc" },
    include: {
      _count: { select: { recipes: true } },
    },
  });

  return NextResponse.json({ occasions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, startMonth, startDay, endMonth, endDay } = body;

  if (!name || !startMonth || !endMonth) {
    return NextResponse.json({ error: "Name, startMonth, and endMonth are required" }, { status: 400 });
  }

  if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
    return NextResponse.json({ error: "Months must be between 1 and 12" }, { status: 400 });
  }

  const slug = slugify(name);

  const occasion = await prisma.occasion.create({
    data: {
      name, slug, description: description || null,
      startMonth, startDay: startDay || 1,
      endMonth, endDay: endDay || 31,
    },
  });

  return NextResponse.json({ occasion }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, description, startMonth, startDay, endMonth, endDay } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name;
    data.slug = slugify(name);
  }
  if (description !== undefined) data.description = description || null;
  if (startMonth !== undefined) data.startMonth = startMonth;
  if (startDay !== undefined) data.startDay = startDay;
  if (endMonth !== undefined) data.endMonth = endMonth;
  if (endDay !== undefined) data.endDay = endDay;

  const occasion = await prisma.occasion.update({
    where: { id },
    data,
  });

  return NextResponse.json({ occasion });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  // Delete recipe links first, then the occasion
  await prisma.recipeOccasion.deleteMany({ where: { occasionId: id } });
  await prisma.occasion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
