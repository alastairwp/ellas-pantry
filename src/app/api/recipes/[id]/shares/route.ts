import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const total = await prisma.share.count({ where: { recipeId } });

  return NextResponse.json({ total });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const { platform } = await request.json();

  if (!platform || typeof platform !== "string") {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }

  await prisma.share.create({
    data: { recipeId, platform },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
