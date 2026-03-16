import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) {
    where.role = role;
  }

  const orderBy: Record<string, string> = {};
  if (sort === "name" || sort === "email" || sort === "role" || sort === "createdAt") {
    orderBy[sort] = order;
  } else {
    orderBy.createdAt = "desc";
  }

  const [users, totalUsers, totalAdmins, recentCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ratings: true,
            reviews: true,
            savedRecipes: true,
            mealPlans: true,
            collections: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalFiltered = await prisma.user.count({ where });

  return NextResponse.json({
    users,
    stats: {
      total: totalUsers,
      admins: totalAdmins,
      regular: totalUsers - totalAdmins,
      recentSignups: recentCount,
    },
    pagination: {
      page,
      limit,
      total: totalFiltered,
      pages: Math.ceil(totalFiltered / limit),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const { userId, role } = await req.json();

  if (!userId || !role || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
  }

  // Prevent demoting yourself
  if (userId === authResult.session.user.id && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent deleting yourself
  if (userId === authResult.session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account from the admin panel" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
