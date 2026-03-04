import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { key } });
  return NextResponse.json({ value: setting?.value ?? null });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const { key, value } = await request.json();
  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  await prisma.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });

  return NextResponse.json({ success: true });
}
